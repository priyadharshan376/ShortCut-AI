import os
import json
import uuid
import logging
import threading
import wsgiref.simple_server
from pathlib import Path
from typing import Dict, Any, Optional

from backend.config import BASE_DIR, DEFAULT_CHANNEL_NAME

logger = logging.getLogger(__name__)

CLIENT_SECRETS_FILE = BASE_DIR / "client_secrets.json"
TOKEN_FILE = BASE_DIR / "backend" / "database" / "youtube_token.json"
CHANNEL_CACHE_FILE = BASE_DIR / "backend" / "database" / "channel_profile.json"

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly"
]

class YouTubeUploader:
    def __init__(self):
        self.client_secrets_file = str(CLIENT_SECRETS_FILE)
        self.token_file = str(TOKEN_FILE)
        self.channel_cache_file = str(CHANNEL_CACHE_FILE)
        self._auth_in_progress = False
        self._last_auth_error: Optional[str] = None

    def is_configured(self) -> bool:
        """Check if OAuth client credentials exist."""
        return os.path.exists(self.client_secrets_file)

    def is_authenticated(self) -> bool:
        """Check if user has an authorized token saved."""
        if not os.path.exists(self.token_file):
            return False
        try:
            with open(self.token_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return bool(data.get("token") or data.get("access_token") or data.get("refresh_token"))
        except Exception:
            return False

    def save_client_secrets(self, raw_json: str) -> Dict[str, Any]:
        """Validate and save user's Google Cloud OAuth client_secrets.json."""
        try:
            parsed = json.loads(raw_json)
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON format: {e}")

        if "installed" not in parsed and "web" not in parsed:
            raise ValueError(
                "Invalid client_secrets.json: Must contain 'installed' (Desktop App) or 'web' OAuth credentials from Google Cloud Console."
            )

        with open(self.client_secrets_file, "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2)

        client_type = "Desktop App (installed)" if "installed" in parsed else "Web App"
        logger.info(f"Saved client_secrets.json ({client_type})")
        return {"success": True, "client_type": client_type}

    def disconnect(self) -> Dict[str, Any]:
        """Disconnects the currently authorized YouTube channel so user can switch accounts."""
        removed = []
        for path_str in [self.token_file, self.channel_cache_file]:
            if os.path.exists(path_str):
                os.remove(path_str)
                removed.append(Path(path_str).name)
        return {"success": True, "removed": removed}

    def fetch_and_cache_channel_profile(self) -> Optional[Dict[str, Any]]:
        """Fetches connected YouTube channel name, avatar, and stats from YouTube API."""
        if not self.is_authenticated():
            return None

        try:
            from google.oauth2.credentials import Credentials
            from google.auth.transport.requests import Request
            from googleapiclient.discovery import build

            with open(self.token_file, "r", encoding="utf-8") as f:
                token_data = json.load(f)

            token_scopes = token_data.get("scopes", SCOPES)
            credentials = Credentials.from_authorized_user_info(token_data, token_scopes)
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                with open(self.token_file, "w", encoding="utf-8") as f:
                    f.write(credentials.to_json())

            youtube = build("youtube", "v3", credentials=credentials)
            res = youtube.channels().list(mine=True, part="snippet,statistics").execute()
            items = res.get("items", [])
            if items:
                ch = items[0]
                snippet = ch.get("snippet", {})
                stats = ch.get("statistics", {})
                profile = {
                    "id": ch.get("id", ""),
                    "name": snippet.get("title", DEFAULT_CHANNEL_NAME),
                    "handle": snippet.get("customUrl", ""),
                    "thumbnail": snippet.get("thumbnails", {}).get("default", {}).get("url", ""),
                    "subscribers": stats.get("subscriberCount", "0"),
                    "video_count": stats.get("videoCount", "0"),
                    "target_url": f"https://studio.youtube.com/channel/{ch.get('id', '')}"
                }
                Path(self.channel_cache_file).parent.mkdir(parents=True, exist_ok=True)
                with open(self.channel_cache_file, "w", encoding="utf-8") as f:
                    json.dump(profile, f, indent=2)
                return profile
        except Exception as e:
            logger.warning(f"Could not fetch channel profile (may have upload-only scope): {e}")

        # Fallback if token only has youtube.upload scope
        fallback = {
            "id": "",
            "name": DEFAULT_CHANNEL_NAME,
            "handle": "",
            "thumbnail": "",
            "subscribers": "-",
            "video_count": "-",
            "target_url": "https://studio.youtube.com"
        }
        return fallback

    def get_channel_profile(self) -> Dict[str, Any]:
        """Returns cached channel profile or fetches it if authenticated."""
        if not self.is_authenticated():
            return {
                "id": "",
                "name": "Not Connected",
                "handle": "",
                "thumbnail": "",
                "subscribers": "0",
                "video_count": "0",
                "target_url": "https://studio.youtube.com"
            }

        if os.path.exists(self.channel_cache_file):
            try:
                with open(self.channel_cache_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass

        return self.fetch_and_cache_channel_profile() or {
            "id": "",
            "name": DEFAULT_CHANNEL_NAME,
            "handle": "",
            "thumbnail": "",
            "target_url": "https://studio.youtube.com"
        }

    def get_auth_status(self) -> Dict[str, Any]:
        """Returns complete YouTube connection status and channel details."""
        configured = self.is_configured()
        authenticated = self.is_authenticated()
        channel = self.get_channel_profile() if authenticated else None
        return {
            "configured": configured,
            "authenticated": authenticated,
            "mode": "live" if (configured and authenticated) else "simulation",
            "auth_in_progress": self._auth_in_progress,
            "last_auth_error": self._last_auth_error,
            "channel": channel
        }

    def start_web_auth_flow(self) -> Dict[str, Any]:
        """
        Starts an asynchronous local OAuth receiver and returns the Google authorization URL
        so users can connect their YouTube channel directly from the ShortCut AI dashboard.
        """
        if not self.is_configured():
            raise FileNotFoundError("client_secrets.json is missing. Upload or place client_secrets.json first.")

        from google_auth_oauthlib.flow import InstalledAppFlow, _RedirectWSGIApp, _ExclusiveWSGIServer, _WSGIRequestHandler

        self._last_auth_error = None
        flow = InstalledAppFlow.from_client_secrets_file(self.client_secrets_file, SCOPES)

        success_html = (
            "ShortCut AI connected your YouTube channel successfully! "
            "You can close this tab and return to ShortCut AI."
        )
        wsgi_app = _RedirectWSGIApp(success_html)
        local_server = wsgiref.simple_server.make_server(
            "localhost",
            0,
            wsgi_app,
            server_class=_ExclusiveWSGIServer,
            handler_class=_WSGIRequestHandler,
        )

        flow.redirect_uri = f"http://localhost:{local_server.server_port}/"
        auth_url, _ = flow.authorization_url(prompt="consent", access_type="offline")

        def _wait_for_callback():
            self._auth_in_progress = True
            try:
                local_server.timeout = 180  # 3 minute timeout
                local_server.handle_request()
                if not hasattr(wsgi_app, "last_request_uri"):
                    raise TimeoutError("Authorization timed out before completing sign-in.")
                authorization_response = wsgi_app.last_request_uri.replace("http", "https")
                flow.fetch_token(authorization_response=authorization_response)

                Path(self.token_file).parent.mkdir(parents=True, exist_ok=True)
                with open(self.token_file, "w", encoding="utf-8") as f:
                    f.write(flow.credentials.to_json())

                self.fetch_and_cache_channel_profile()
                logger.info("YouTube channel connected via web OAuth wizard.")
            except Exception as err:
                logger.error(f"Web OAuth flow failed: {err}")
                self._last_auth_error = str(err)
            finally:
                self._auth_in_progress = False
                local_server.server_close()

        t = threading.Thread(target=_wait_for_callback, daemon=True)
        t.start()

        return {
            "success": True,
            "auth_url": auth_url,
            "callback_port": local_server.server_port
        }

    def upload_short(
        self,
        video_path: str,
        title: str,
        description: str,
        tags: Optional[list] = None,
        privacy_status: str = "public",
        publish_at: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Uploads a video to YouTube Shorts using YouTube Data API v3.
        Supports native scheduled release via publish_at (ISO 8601 UTC string).
        If credentials are not yet configured, runs in verified simulation mode.
        """
        if not os.path.exists(video_path):
            raise FileNotFoundError(f"Video file to upload does not exist: {video_path}")

        status = self.get_auth_status()

        if status["mode"] == "live":
            try:
                from google.oauth2.credentials import Credentials
                from google.auth.transport.requests import Request
                from googleapiclient.discovery import build
                from googleapiclient.http import MediaFileUpload

                with open(self.token_file, "r", encoding="utf-8") as f:
                    token_data = json.load(f)
                token_scopes = token_data.get("scopes", ["https://www.googleapis.com/auth/youtube.upload"])
                credentials = Credentials.from_authorized_user_info(token_data, token_scopes)
                if credentials.expired and credentials.refresh_token:
                    credentials.refresh(Request())
                    with open(self.token_file, "w", encoding="utf-8") as f:
                        f.write(credentials.to_json())

                youtube = build("youtube", "v3", credentials=credentials)

                status_config = {
                    "selfDeclaredMadeForKids": False
                }

                if publish_at:
                    # YouTube requirement: scheduled videos MUST have privacyStatus set to 'private'
                    status_config["privacyStatus"] = "private"
                    status_config["publishAt"] = publish_at
                    logger.info(f"Video scheduled to go public at: {publish_at}")
                else:
                    status_config["privacyStatus"] = privacy_status

                body = {
                    "snippet": {
                        "title": title[:100],
                        "description": description,
                        "tags": tags or ["Shorts", "ShortCutAI", "ViralShorts"],
                        "categoryId": "22"
                    },
                    "status": status_config
                }

                media = MediaFileUpload(video_path, chunksize=-1, resumable=True, mimetype="video/mp4")
                request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
                response = request.execute()

                video_id = response.get("id")
                return {
                    "success": True,
                    "mode": "live",
                    "youtube_video_id": video_id,
                    "youtube_url": f"https://www.youtube.com/shorts/{video_id}",
                    "scheduled_publish_at": publish_at,
                    "privacy_status": status_config.get("privacyStatus")
                }
            except Exception as e:
                logger.error(f"Live YouTube upload failed: {e}")
                raise RuntimeError(f"YouTube upload error: {str(e)}")

        else:
            logger.info("Executing YouTube upload in Sandbox Simulation mode (no channel connected yet).")
            simulated_id = f"SC_{uuid.uuid4().hex[:10]}"
            return {
                "success": True,
                "mode": "simulation",
                "youtube_video_id": simulated_id,
                "youtube_url": f"https://www.youtube.com/shorts/{simulated_id}",
                "scheduled_publish_at": publish_at,
                "privacy_status": "private" if publish_at else privacy_status,
                "note": "Uploaded in local simulation mode. Connect your YouTube channel in the Setup tab to enable live uploads."
            }

_uploader_instance = None

def get_youtube_uploader() -> YouTubeUploader:
    global _uploader_instance
    if _uploader_instance is None:
        _uploader_instance = YouTubeUploader()
    return _uploader_instance
