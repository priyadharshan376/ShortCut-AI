import React, { useState, useEffect } from 'react';
import {
  Flame,
  Upload,
  Video,
  Play,
  CheckCircle,
  Youtube,
  BarChart3,
  Clock,
  Sparkles,
  RefreshCw,
  Sliders,
  Download,
  Eye,
  Calendar,
  CheckSquare,
  Square,
  Send,
  X,
  ListPlus,
  ArrowRight,
  ExternalLink,
  Zap,
  TrendingUp,
  Layers,
  Link2,
  Search,
  Key,
  HelpCircle,
  ShieldCheck,
  AlertCircle,
  Unlink
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [analytics, setAnalytics] = useState({
    total_videos: 0,
    total_shorts: 0,
    pending_uploads: 0,
    completed_uploads: 0,
    recent_videos: [],
    recent_clips: [],
    top_clips: [],
    upcoming_scheduled: [],
    channel_info: {
      name: 'Not Connected',
      handle: '',
      thumbnail: '',
      configured: false,
      authenticated: false,
      status: 'not_connected',
      mode: 'simulation',
      target_url: 'https://studio.youtube.com'
    }
  });

  // Channel Setup & Connect Wizard State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [secretsJsonInput, setSecretsJsonInput] = useState('');
  const [authUrl, setAuthUrl] = useState('');
  const [isSavingSecrets, setIsSavingSecrets] = useState(false);
  const [isConnectingAuth, setIsConnectingAuth] = useState(false);
  const [connectMessage, setConnectMessage] = useState(null);

  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [clips, setClips] = useState([]);
  const [selectedClip, setSelectedClip] = useState(null);
  const [uploads, setUploads] = useState([]);

  // Batch Selection & Scheduling State
  const [selectedClipIds, setSelectedClipIds] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleInterval, setScheduleInterval] = useState(30);
  const [scheduleStartNow, setScheduleStartNow] = useState(true);
  const [customStartTime, setCustomStartTime] = useState('');
  const [batchLayoutMode, setBatchLayoutMode] = useState('auto');
  const [batchForceRerender, setBatchForceRerender] = useState(false);
  const [isBatchPublishing, setIsBatchPublishing] = useState(false);
  const [batchProgressText, setBatchProgressText] = useState('');
  const [batchResults, setBatchResults] = useState(null);

  // Active Job State for Real-Time Progress Bar & Activity Tracking
  const [activeJob, setActiveJob] = useState(null);

  // Upload & Pipeline State
  const [uploadMode, setUploadMode] = useState('local'); // 'local' | 'youtube'
  const [uploadFile, setUploadFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeResolution, setYoutubeResolution] = useState('720p');
  const [isInspecting, setIsInspecting] = useState(false);
  const [youtubeMetadata, setYoutubeMetadata] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Editor State
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLayout, setEditLayout] = useState('auto');
  const [singleScheduleTime, setSingleScheduleTime] = useState('');
  const [renderingClipId, setRenderingClipId] = useState(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [privacyStatus, setPrivacyStatus] = useState('public');

  useEffect(() => {
    fetchAnalytics();
    fetchVideos();
    fetchYouTubeUploads();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/analytics`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const fetchVideos = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/videos`);
      if (res.ok) {
        const data = await res.json();
        const vids = data.videos || [];
        setVideos(vids);
        if (vids.length > 0 && !selectedVideo) {
          setSelectedVideo(vids[0]);
          loadClipsForVideo(vids[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load videos:', err);
    }
  };

  const loadClipsForVideo = async (videoId, preserveClipId = null) => {
    try {
      const res = await fetch(`${API_BASE}/api/videos/${videoId}/clips`);
      if (res.ok) {
        const data = await res.json();
        const loadedClips = data.clips || [];
        setClips(loadedClips);
        setSelectedClipIds([]);

        if (preserveClipId) {
          const match = loadedClips.find(c => c.id === preserveClipId);
          if (match) selectClipForPreview(match);
        } else if (loadedClips.length > 0) {
          if (!selectedClip || selectedClip.video_id !== videoId) {
            selectClipForPreview(loadedClips[0]);
          }
        } else {
          setSelectedClip(null);
        }
      }
    } catch (err) {
      console.error('Failed to load clips:', err);
    }
  };

  const fetchYouTubeUploads = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/youtube/uploads`);
      if (res.ok) {
        const data = await res.json();
        setUploads(data.uploads || []);
      }
    } catch (err) {
      console.error('Failed to load YouTube uploads:', err);
    }
  };

  // Channel Setup & Connect Handlers
  const handleSaveClientSecrets = async () => {
    if (!secretsJsonInput.trim()) return;
    setIsSavingSecrets(true);
    setConnectMessage(null);
    try {
      const res = await fetch(`${API_BASE}/api/youtube/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_secrets_json: secretsJsonInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to save credentials');
      setConnectMessage({ type: 'success', text: `Credentials saved (${data.client_type})! Now click "Authorize YouTube Channel" below.` });
      await fetchAnalytics();
    } catch (err) {
      setConnectMessage({ type: 'error', text: err.message });
    } finally {
      setIsSavingSecrets(false);
    }
  };

  const handleSecretsFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setSecretsJsonInput(evt.target.result);
    };
    reader.readAsText(file);
  };

  const handleStartConnectAuth = async () => {
    setIsConnectingAuth(true);
    setConnectMessage(null);
    setAuthUrl('');
    try {
      const res = await fetch(`${API_BASE}/api/youtube/connect`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Could not start YouTube authorization');
      setAuthUrl(data.auth_url);
      window.open(data.auth_url, '_blank');

      // Poll until authenticated
      const pollAuth = setInterval(async () => {
        try {
          const stRes = await fetch(`${API_BASE}/api/youtube/status`);
          if (stRes.ok) {
            const st = await stRes.json();
            if (st.authenticated) {
              clearInterval(pollAuth);
              setIsConnectingAuth(false);
              setAuthUrl('');
              setConnectMessage({ type: 'success', text: `Connected to YouTube Channel: ${st.channel?.name || 'Your Channel'}!` });
              await fetchAnalytics();
            } else if (!st.auth_in_progress && st.last_auth_error) {
              clearInterval(pollAuth);
              setIsConnectingAuth(false);
              setConnectMessage({ type: 'error', text: `Auth error: ${st.last_auth_error}` });
            }
          }
        } catch (err) {
          console.error('Auth poll error:', err);
        }
      }, 1500);
    } catch (err) {
      setIsConnectingAuth(false);
      setConnectMessage({ type: 'error', text: err.message });
    }
  };

  const handleDisconnectChannel = async () => {
    if (!window.confirm('Disconnect the current YouTube channel? You can reconnect another channel anytime.')) return;
    try {
      await fetch(`${API_BASE}/api/youtube/disconnect`, { method: 'POST' });
      setConnectMessage({ type: 'success', text: 'Channel disconnected. Ready to connect a new channel.' });
      await fetchAnalytics();
    } catch (err) {
      alert('Disconnect failed: ' + err.message);
    }
  };

  const selectClipForPreview = (clip) => {
    setSelectedClip(clip);
    setEditTitle(clip.title || '');
    setEditDescription(clip.description || '');
    setEditLayout(clip.layout_mode || 'auto');
  };

  // Checkbox selection helpers
  const toggleClipSelection = (clipId) => {
    setSelectedClipIds(prev =>
      prev.includes(clipId) ? prev.filter(id => id !== clipId) : [...prev, clipId]
    );
  };

  const selectAllClips = () => {
    setSelectedClipIds(clips.map(c => c.id));
  };

  const deselectAllClips = () => {
    setSelectedClipIds([]);
  };

  // Polling helper with rich live status updates
  const startPipelinePolling = (videoId, videoTitle) => {
    const pollInterval = setInterval(async () => {
      try {
        const stRes = await fetch(`${API_BASE}/api/videos/${videoId}/status`);
        if (stRes.ok) {
          const stData = await stRes.json();
          if (stData.status === 'extracting_metadata' || stData.status === 'extracting_audio') {
            const statusMsg = `Extracting 16kHz audio track for Faster-Whisper AI speech analysis...`;
            setProcessingStatus(statusMsg);
            setUploadProgress(45);
            setActiveJob(prev => prev ? {
              ...prev,
              percent: 45,
              stepIndex: 2,
              statusText: statusMsg
            } : null);
          } else if (stData.status === 'transcribing') {
            const statusMsg = `Transcribing speech with Faster-Whisper CPU INT8 (word timestamps)...`;
            setProcessingStatus(statusMsg);
            setUploadProgress(65);
            setActiveJob(prev => prev ? {
              ...prev,
              percent: 65,
              stepIndex: 3,
              statusText: statusMsg
            } : null);
          } else if (stData.status === 'detecting_clips') {
            const statusMsg = `Analyzing 6 viral dimensions & segmenting distinct narrative moments...`;
            setProcessingStatus(statusMsg);
            setUploadProgress(85);
            setActiveJob(prev => prev ? {
              ...prev,
              percent: 85,
              stepIndex: 4,
              statusText: statusMsg
            } : null);
          } else if (stData.status === 'completed') {
            clearInterval(pollInterval);
            const statusMsg = `Completed! Distinct viral moments ready.`;
            setProcessingStatus(statusMsg);
            setUploadProgress(100);
            setActiveJob(prev => prev ? {
              ...prev,
              percent: 100,
              stepIndex: 4,
              statusText: statusMsg
            } : null);

            setTimeout(() => {
              setIsProcessing(false);
              setActiveJob(null);
            }, 3000);

            await fetchVideos();
            await fetchAnalytics();
            setSelectedVideo(stData);
            await loadClipsForVideo(videoId);
            setActiveTab('clips');
          } else if (stData.status === 'failed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
            setActiveJob(null);
            alert(`Processing failed: ${stData.error_message}`);
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 1500);
  };

  // Video Upload Handler with Real-Time Byte-Level Progress
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    const file = uploadFile;
    const totalMB = (file.size / (1024 * 1024)).toFixed(1);

    setIsProcessing(true);
    setUploadProgress(0);
    const initialStatus = `Uploading "${file.name}" (0% • 0.0 MB / ${totalMB} MB)...`;
    setProcessingStatus(initialStatus);
    setActiveJob({
      type: 'source_upload',
      title: file.name,
      statusText: initialStatus,
      percent: 0,
      stepIndex: 1,
      stepTotal: 4,
      loadedMB: '0.0',
      totalMB: totalMB
    });

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/api/videos/upload`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        const filePct = Math.round((evt.loaded / evt.total) * 100);
        // Map upload phase to 0% - 35% of total pipeline progress
        const overallProgress = Math.round(filePct * 0.35);
        const loadedMB = (evt.loaded / (1024 * 1024)).toFixed(1);

        setUploadProgress(overallProgress);
        const statusMsg = `Uploading "${file.name}" (${filePct}% • ${loadedMB} MB / ${totalMB} MB)...`;
        setProcessingStatus(statusMsg);
        setActiveJob(prev => prev ? {
          ...prev,
          percent: overallProgress,
          loadedMB: loadedMB,
          totalMB: totalMB,
          statusText: statusMsg
        } : null);
      }
    };

    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          const videoId = data.video.id;

          setUploadProgress(35);
          const nextMsg = `Upload complete! Extracting audio & preparing Faster-Whisper...`;
          setProcessingStatus(nextMsg);
          setActiveJob(prev => prev ? {
            ...prev,
            percent: 35,
            stepIndex: 2,
            statusText: nextMsg
          } : null);

          startPipelinePolling(videoId, file.name);
        } catch (err) {
          setIsProcessing(false);
          setActiveJob(null);
          alert('Failed to parse server response: ' + err.message);
        }
      } else {
        setIsProcessing(false);
        setActiveJob(null);
        alert(`Upload failed (HTTP ${xhr.status}): ${xhr.responseText}`);
      }
    };

    xhr.onerror = () => {
      setIsProcessing(false);
      setActiveJob(null);
      alert('Upload failed due to a network connection error.');
    };

    xhr.send(formData);
  };

  // YouTube Inspect Handler
  const handleInspectYoutubeUrl = async () => {
    if (!youtubeUrl.trim()) return;
    setIsInspecting(true);
    try {
      const res = await fetch(`${API_BASE}/api/videos/youtube-inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: youtubeUrl.trim() })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Could not fetch YouTube video details');
      }
      const data = await res.json();
      setYoutubeMetadata(data);
      if (data.available_resolutions && data.available_resolutions.length > 0) {
        setYoutubeResolution(data.available_resolutions.includes('1080p') ? '1080p' : data.available_resolutions[0]);
      }
    } catch (err) {
      alert(`YouTube Inspect Error: ${err.message}`);
    } finally {
      setIsInspecting(false);
    }
  };

  // YouTube Download & Process Pipeline Handler
  const handleYoutubeDownloadSubmit = async (e) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    const videoTitle = youtubeMetadata ? youtubeMetadata.title : 'YouTube Video';
    setIsProcessing(true);
    setUploadProgress(15);
    const initialStatus = `Connecting & downloading YouTube video (${youtubeResolution}) for "${videoTitle}"...`;
    setProcessingStatus(initialStatus);
    setActiveJob({
      type: 'youtube_download',
      title: videoTitle,
      statusText: initialStatus,
      percent: 15,
      stepIndex: 1,
      stepTotal: 4
    });

    try {
      const res = await fetch(`${API_BASE}/api/videos/youtube-download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: youtubeUrl.trim(),
          resolution: youtubeResolution
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'YouTube download failed');
      }

      const data = await res.json();
      const videoId = data.video.id;

      setUploadProgress(35);
      const nextMsg = `Download complete! Extracting audio & preparing Faster-Whisper CPU INT8...`;
      setProcessingStatus(nextMsg);
      setActiveJob(prev => prev ? {
        ...prev,
        percent: 35,
        stepIndex: 2,
        statusText: nextMsg
      } : null);

      startPipelinePolling(videoId, videoTitle);

    } catch (err) {
      setIsProcessing(false);
      setActiveJob(null);
      alert(`YouTube Download error: ${err.message}`);
    }
  };

  // Render Short Handler
  const handleRenderShort = async (clipId, customLayout = null) => {
    setRenderingClipId(clipId);
    const layout = customLayout || editLayout;
    try {
      const res = await fetch(`${API_BASE}/api/clips/${clipId}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout_mode: layout, include_subtitles: true })
      });
      if (!res.ok) throw new Error('Render failed');
      const data = await res.json();
      
      const updated = data.clip;
      selectClipForPreview(updated);
      setClips(prev => prev.map(c => c.id === clipId ? updated : c));
      fetchAnalytics();
      alert(`Short rendered successfully in 9:16 format with burned-in subtitles!`);
    } catch (err) {
      alert(`Render error: ${err.message}`);
    } finally {
      setRenderingClipId(null);
    }
  };

  // Re-run Detection
  const handleRedetectClips = async () => {
    if (!selectedVideo) return;
    try {
      const res = await fetch(`${API_BASE}/api/videos/${selectedVideo.id}/detect-clips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_duration: 35.0, max_duration: 75.0, max_clips: 10 })
      });
      if (res.ok) {
        await loadClipsForVideo(selectedVideo.id);
        alert('Re-analyzed video! Generated distinct narrative story moments with visual chart/whiteboard awareness.');
      }
    } catch (err) {
      alert('Failed to re-detect clips: ' + err.message);
    }
  };

  // Single YouTube Upload Handler
  const handlePublishYouTube = async (clipId, scheduledAt = null) => {
    const clip = clips.find(c => c.id === clipId) || selectedClip;
    const clipTitle = clip ? clip.title : 'Short';
    const channelName = analytics.channel_info?.name || 'Your Channel';

    setIsPublishing(true);
    setActiveJob({
      type: 'youtube_publish',
      title: clipTitle,
      statusText: `Preparing to upload "${clipTitle}" to ${channelName}...`,
      percent: 30
    });

    try {
      const payload = {
        privacy_status: scheduledAt ? 'private' : privacyStatus,
        custom_title: editTitle || (clip ? clip.title : null),
        custom_description: editDescription || (clip ? clip.description : null),
        publish_at: scheduledAt || (singleScheduleTime ? new Date(singleScheduleTime).toISOString() : null)
      };

      setActiveJob(prev => prev ? {
        ...prev,
        percent: 65,
        statusText: `Uploading "${clipTitle}" via YouTube Data API v3...`
      } : null);

      const res = await fetch(`${API_BASE}/api/clips/${clipId}/upload-youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.detail || 'YouTube publish failed');
      }
      const data = await res.json();
      setActiveJob(prev => prev ? {
        ...prev,
        percent: 100,
        statusText: `Published! Video ID: ${data.upload?.youtube_video_id || 'Done'}`
      } : null);
      alert(`Published! YouTube URL: ${data.upload.youtube_url}${payload.publish_at ? ` (Scheduled for ${payload.publish_at})` : ''}`);
      fetchYouTubeUploads();
      fetchAnalytics();
    } catch (err) {
      alert(`Publish error: ${err.message}`);
    } finally {
      setIsPublishing(false);
      setTimeout(() => setActiveJob(null), 3500);
    }
  };

  // Batch Upload & Schedule Handler with Per-Clip Live Queue Progress
  const handleBatchScheduleSubmit = async (customClipIds = null) => {
    const idsToUpload = customClipIds || (selectedClipIds.length > 0 ? selectedClipIds : clips.map(c => c.id));
    if (idsToUpload.length === 0) {
      alert('No clips selected to upload.');
      return;
    }

    setIsBatchPublishing(true);
    setBatchResults(null);
    const totalClips = idsToUpload.length;
    const channelName = analytics.channel_info?.name || 'YouTube';

    const subItems = idsToUpload.map((id, idx) => {
      const c = clips.find(clip => clip.id === id);
      return {
        id,
        title: c ? c.title : `Short #${idx + 1}`,
        status: 'pending'
      };
    });

    setActiveJob({
      type: 'youtube_batch',
      title: `Batch Publishing ${totalClips} Shorts to ${channelName}`,
      statusText: `Initializing release queue (interval: ${scheduleInterval}m)...`,
      percent: 5,
      subItems
    });
    setBatchProgressText(`Starting upload sequence for ${totalClips} Shorts...`);

    const intervalMinutes = parseInt(scheduleInterval) || 30;
    const startDt = customStartTime ? new Date(customStartTime) : new Date();
    const results = [];
    const errors = [];

    for (let i = 0; i < idsToUpload.length; i++) {
      const clipId = idsToUpload[i];
      const clip = clips.find(c => c.id === clipId);
      const clipTitle = clip ? clip.title : `Short #${i + 1}`;

      subItems[i].status = 'uploading';
      const pct = Math.round((i / totalClips) * 100);
      const statusMsg = `[${i + 1}/${totalClips}] Preparing "${clipTitle}"...`;
      setBatchProgressText(statusMsg);
      setActiveJob(prev => prev ? {
        ...prev,
        title: `Uploading [${i + 1}/${totalClips}]: ${clipTitle}`,
        statusText: statusMsg,
        percent: Math.max(pct, 5),
        subItems: [...subItems]
      } : null);

      try {
        let publishAtStr = null;
        if (!scheduleStartNow || i > 0) {
          const delayMinutes = (scheduleStartNow ? i : (i + 1)) * intervalMinutes;
          const clipPublishDt = new Date(startDt.getTime() + delayMinutes * 60000);
          publishAtStr = clipPublishDt.toISOString();
        }

        if (!clip || !clip.output_path || batchForceRerender) {
          const renderMsg = `[${i + 1}/${totalClips}] Rendering 9:16 layout (${batchLayoutMode}) for "${clipTitle}"...`;
          setBatchProgressText(renderMsg);
          setActiveJob(prev => prev ? { ...prev, statusText: renderMsg, subItems: [...subItems] } : null);

          const renderRes = await fetch(`${API_BASE}/api/clips/${clipId}/render`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ layout_mode: batchLayoutMode, include_subtitles: true })
          });
          if (!renderRes.ok) {
            const errR = await renderRes.json();
            throw new Error(errR.detail || 'Render failed');
          }
        }

        const uploadMsg = `[${i + 1}/${totalClips}] Uploading "${clipTitle}" to ${channelName}...`;
        setBatchProgressText(uploadMsg);
        setActiveJob(prev => prev ? { ...prev, statusText: uploadMsg, subItems: [...subItems] } : null);

        const upRes = await fetch(`${API_BASE}/api/clips/${clipId}/upload-youtube`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            privacy_status: publishAtStr ? 'private' : privacyStatus,
            custom_title: clip ? clip.title : null,
            custom_description: clip ? clip.description : null,
            publish_at: publishAtStr
          })
        });

        if (!upRes.ok) {
          const errU = await upRes.json();
          throw new Error(errU.detail || 'Upload failed');
        }

        const upData = await upRes.json();
        subItems[i].status = 'completed';
        results.push(upData.upload);
      } catch (err) {
        subItems[i].status = 'failed';
        errors.push({ clip_id: clipId, title: clipTitle, error: err.message });
      }

      const donePct = Math.round(((i + 1) / totalClips) * 100);
      setActiveJob(prev => prev ? { ...prev, percent: donePct, subItems: [...subItems] } : null);
    }

    setBatchResults({
      scheduled_count: results.length,
      error_count: errors.length,
      results,
      errors
    });
    setBatchProgressText(`Completed: ${results.length} uploaded/scheduled, ${errors.length} failed.`);
    await fetchYouTubeUploads();
    await fetchAnalytics();
    setIsBatchPublishing(false);

    setTimeout(() => setActiveJob(null), 4500);
  };

  // Helper to preview schedule timeline dates
  const getTimelinePreview = () => {
    const idsToUpload = selectedClipIds.length > 0 ? selectedClipIds : clips.map(c => c.id);
    const base = customStartTime ? new Date(customStartTime) : new Date();
    const interval = parseInt(scheduleInterval) || 30;

    return idsToUpload.slice(0, 8).map((clipId, idx) => {
      const clipObj = clips.find(c => c.id === clipId);
      const offsetMinutes = scheduleStartNow ? (idx * interval) : ((idx + 1) * interval);
      const scheduleTime = new Date(base.getTime() + offsetMinutes * 60000);
      return {
        clipId,
        title: clipObj ? clipObj.title : `Clip #${idx + 1}`,
        isImmediate: scheduleStartNow && idx === 0,
        timeStr: scheduleTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        dateStr: scheduleTime.toLocaleDateString([], { month: 'short', day: 'numeric' })
      };
    });
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-badge" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>SC</div>
          <div className="logo-text">
            <h1>ShortCut AI</h1>
            <span>Shorts Studio • AI Auto-Publisher</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); fetchAnalytics(); }}
          >
            <BarChart3 size={18} />
            <span>Dashboard</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={18} />
            <span>New Project</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'clips' ? 'active' : ''}`}
            onClick={() => setActiveTab('clips')}
          >
            <Flame size={18} />
            <span>Viral Moments ({clips.length})</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            <Sliders size={18} />
            <span>Shorts Editor</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'youtube' ? 'active' : ''}`}
            onClick={() => setActiveTab('youtube')}
          >
            <Youtube size={18} />
            <span>Publish History ({uploads.length})</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div
            className="hardware-pill"
            onClick={() => setShowConnectModal(true)}
            style={{ cursor: 'pointer' }}
            title="Click to connect or manage your YouTube channel"
          >
            <div className="hardware-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Channel: {analytics.channel_info?.name || 'Not Connected'}</span>
              <Key size={12} color="#60a5fa" />
            </div>
            <div className="hardware-spec">
              {analytics.channel_info?.status === 'connected' ? '✓ YouTube Connected • Live Upload' : '⚠️ Setup Required • Click to Connect'}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <div className="content-container">

          {/* TAB 1: ENRICHED USEFUL DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div>
              {/* Channel Connection Banner */}
              <div
                className="channel-banner"
                style={{
                  border: analytics.channel_info?.status === 'connected'
                    ? '1px solid rgba(16, 185, 129, 0.4)'
                    : '1px solid rgba(249, 115, 22, 0.4)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {analytics.channel_info?.thumbnail ? (
                    <img
                      src={analytics.channel_info.thumbnail}
                      alt="Channel avatar"
                      style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: analytics.channel_info?.status === 'connected'
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #f97316, #ef4444)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 20,
                        fontWeight: 800,
                        color: '#fff'
                      }}
                    >
                      {analytics.channel_info?.name && analytics.channel_info.name !== 'Not Connected'
                        ? analytics.channel_info.name.slice(0, 2).toUpperCase()
                        : 'SC'}
                    </div>
                  )}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <h2 style={{ fontSize: 18, fontWeight: 800 }}>
                        {analytics.channel_info?.status === 'connected'
                          ? `YouTube Channel: ${analytics.channel_info.name}`
                          : 'YouTube Channel: Setup Required'}
                      </h2>
                      {analytics.channel_info?.status === 'connected' ? (
                        <span className="badge-live">
                          <span className="pulsing-dot"></span> Live API Connected
                        </span>
                      ) : (
                        <span
                          className="badge-live"
                          style={{
                            background: 'rgba(249, 115, 22, 0.15)',
                            color: '#fb923c',
                            borderColor: 'rgba(249, 115, 22, 0.3)'
                          }}
                        >
                          <span className="pulsing-dot" style={{ background: '#f97316' }}></span> Setup Required
                        </span>
                      )}
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                      {analytics.channel_info?.status === 'connected'
                        ? 'Automated 9:16 Shorts pipeline with custom layout framing and 20–30m batch interval scheduling.'
                        : 'Connect your YouTube channel using free Google Cloud credentials to upload and schedule Shorts automatically.'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {analytics.channel_info?.status !== 'connected' ? (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowConnectModal(true)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
                      }}
                    >
                      <Key size={14} /> Connect YouTube Channel
                    </button>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleDisconnectChannel}
                      title="Disconnect or switch YouTube account"
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Unlink size={14} /> Disconnect
                    </button>
                  )}
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setUploadMode('youtube'); setActiveTab('upload'); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Link2 size={14} /> Import from YouTube
                  </button>
                  <a
                    href={analytics.channel_info?.target_url || "https://studio.youtube.com"}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ExternalLink size={14} /> Open YouTube Studio
                  </a>
                  {clips.length > 0 && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => { selectAllClips(); setShowScheduleModal(true); }}
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                    >
                      <Calendar size={14} /> Schedule All ({clips.length})
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="metric-cards">
                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Master Projects</span>
                    <Video size={18} color="var(--accent-red)" />
                  </div>
                  <div className="metric-value">{analytics.total_videos}</div>
                  <div className="metric-footer">Analyzed Long Videos</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Story Moments</span>
                    <Flame size={18} color="var(--accent-orange)" />
                  </div>
                  <div className="metric-value">{clips.length || analytics.total_shorts}</div>
                  <div className="metric-footer">Distinct Narrative Clips</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">Rendered 9:16 Shorts</span>
                    <Sparkles size={18} color="var(--accent-purple)" />
                  </div>
                  <div className="metric-value">{analytics.total_shorts}</div>
                  <div className="metric-footer">Framed & Subtitled</div>
                </div>

                <div className="metric-card">
                  <div className="metric-header">
                    <span className="metric-title">YouTube Published</span>
                    <Youtube size={18} color="var(--accent-green)" />
                  </div>
                  <div className="metric-value">{analytics.completed_uploads}</div>
                  <div className="metric-footer">Uploaded to YouTube</div>
                </div>
              </div>

              {/* 2-Column Dashboard Grid: Ranked Moments & Live Queue */}
              <div className="dashboard-grid">
                {/* Left Column: Top Viral Highlights with 1-Click Action */}
                <div className="dashboard-panel">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700 }}>🔥 Top Ranked Story Moments</h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        Top AI-scored self-contained clips from your video ready for immediate launch.
                      </p>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActiveTab('clips')}
                    >
                      View All ({clips.length}) <ArrowRight size={14} />
                    </button>
                  </div>

                  {clips.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                      <p>No project moments loaded.</p>
                      <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => setActiveTab('upload')}>
                        <Upload size={14} /> Upload Video Project
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {clips.slice(0, 4).map((c, i) => (
                        <div key={c.id} className="top-moment-card">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, maxWidth: '65%' }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: i === 0 ? '#eab308' : '#94a3b8' }}>
                              #{i + 1}
                            </span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {c.title}
                              </div>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 3 }}>
                                <span className={`viral-badge ${c.viral_score >= 70 ? 'high' : 'medium'}`} style={{ padding: '2px 6px', fontSize: 11 }}>
                                  <Flame size={12} /> {c.viral_score}
                                </span>
                                {c.has_visual && (
                                  <span className="viral-badge" style={{ padding: '2px 6px', fontSize: 11, background: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa' }}>
                                    🎨 Visual Demo
                                  </span>
                                )}
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                  ⏱️ {c.duration.toFixed(0)}s
                                </span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => { selectClipForPreview(c); setActiveTab('editor'); }}
                              title="Preview and edit clip"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleRenderShort(c.id)}
                              disabled={renderingClipId === c.id}
                              title="Render in 9:16"
                            >
                              <Sparkles size={13} /> {c.output_path ? 'Re-Render' : 'Render'}
                            </button>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handlePublishYouTube(c.id)}
                              disabled={isPublishing || !c.output_path}
                              title="Publish directly to PDX"
                            >
                              <Youtube size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Column: Scheduled Release Queue & Strategy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Scheduled Queue Box */}
                  <div className="dashboard-panel">
                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📅 Release Queue</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 12 }}>
                      Upcoming Shorts scheduled on YouTube Data API.
                    </p>

                    {analytics.upcoming_scheduled && analytics.upcoming_scheduled.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                        {analytics.upcoming_scheduled.map((sch, sIdx) => (
                          <div key={sch.id} style={{ background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border-color)' }}>
                            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {sch.title}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa', marginTop: 3 }}>
                              <span>⏰ {new Date(sch.scheduled_publish_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(sch.scheduled_publish_at).toLocaleDateString([], { month: 'short', day: 'numeric' })})</span>
                              {sch.youtube_url && (
                                <a href={sch.youtube_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                                  View ↗
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: 12 }}>
                        No videos currently in the queue. Click "Schedule All" to queue your moments at 20–30 min intervals!
                      </div>
                    )}
                  </div>

                  {/* Growth & Algorithm Tips */}
                  <div className="dashboard-panel">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <TrendingUp size={16} color="var(--accent-orange)" />
                      <h3 style={{ fontSize: 15, fontWeight: 700 }}>YouTube Shorts Strategy</h3>
                    </div>

                    <div className="tip-box">
                      <strong>⚡ Pacing Velocity:</strong> Publishing every <strong>20 to 30 minutes</strong> gives YouTube's algorithm time to test each Short's seed audience without diluting initial viewer impressions.
                    </div>

                    <div className="tip-box" style={{ background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.3)' }}>
                      <strong>🎨 Visual Retainers:</strong> Whiteboard demonstrations and visual diagrams achieve <strong>80%+ viewer completion rates</strong> on Shorts. Always prefer "Auto-Detect" or "Blurred Background" for these moments!
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NEW PROJECT (LOCAL UPLOAD OR YOUTUBE URL) */}
          {activeTab === 'upload' && (
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <div className="editor-form">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700 }}>New Video Project</h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                      Add a video to detect complete narrative story moments and whiteboard visuals.
                    </p>
                  </div>
                </div>

                {/* Mode Switcher Tabs */}
                <div className="upload-mode-switcher">
                  <button
                    type="button"
                    className={`mode-tab-btn ${uploadMode === 'local' ? 'active' : ''}`}
                    onClick={() => setUploadMode('local')}
                  >
                    <Upload size={16} /> Upload Local File (Up to 1.5 GB)
                  </button>
                  <button
                    type="button"
                    className={`mode-tab-btn ${uploadMode === 'youtube' ? 'active' : ''}`}
                    onClick={() => setUploadMode('youtube')}
                  >
                    <Link2 size={16} /> Paste YouTube Link
                  </button>
                </div>

                {/* MODE 1: LOCAL FILE DROPZONE */}
                {uploadMode === 'local' && (
                  <div>
                    <div
                      className="dropzone"
                      onClick={() => document.getElementById('file-input').click()}
                    >
                      <input
                        id="file-input"
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-matroska,video/x-msvideo"
                        style={{ display: 'none' }}
                        onChange={(e) => setUploadFile(e.target.files[0])}
                      />
                      <div className="dropzone-icon">
                        <Upload size={32} />
                      </div>
                      <h3>{uploadFile ? uploadFile.name : 'Select or drop video file here'}</h3>
                      <p>{uploadFile ? `${(uploadFile.size / (1024 * 1024)).toFixed(1)} MB` : 'Supports MP4, MOV, MKV, AVI • Up to 1.5 GB'}</p>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={handleUploadSubmit}
                      disabled={!uploadFile || isProcessing}
                      style={{ width: '100%', padding: '14px' }}
                    >
                      <Sparkles size={18} />
                      {isProcessing ? 'Processing Pipeline...' : 'Start AI Story Analysis'}
                    </button>
                  </div>
                )}

                {/* MODE 2: YOUTUBE URL DOWNLOAD & RESOLUTION SELECTOR */}
                {uploadMode === 'youtube' && (
                  <div>
                    <div className="form-group" style={{ marginBottom: 16 }}>
                      <label>Paste YouTube Video or Shorts URL</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                          value={youtubeUrl}
                          onChange={(e) => {
                            setYoutubeUrl(e.target.value);
                            setYoutubeMetadata(null);
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleInspectYoutubeUrl}
                          disabled={!youtubeUrl.trim() || isInspecting || isProcessing}
                          style={{ whiteSpace: 'nowrap' }}
                        >
                          <Search size={15} />
                          {isInspecting ? 'Fetching...' : 'Inspect Video'}
                        </button>
                      </div>
                    </div>

                    {/* YouTube Video Preview Card */}
                    {youtubeMetadata && (
                      <div className="yt-preview-card">
                        {youtubeMetadata.thumbnail && (
                          <div className="yt-thumb-box">
                            <img src={youtubeMetadata.thumbnail} alt="YouTube thumbnail" />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                            {youtubeMetadata.title}
                          </h4>
                          <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-secondary)' }}>
                            <span>📺 {youtubeMetadata.channel}</span>
                            <span>⏱️ {Math.floor(youtubeMetadata.duration / 60)}m {youtubeMetadata.duration % 60}s</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Target Resolution Selection */}
                    <div className="form-group" style={{ marginBottom: 20 }}>
                      <label>Download Resolution</label>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                        {['1080p', '720p', '480p', 'Best Available'].map((res) => (
                          <button
                            key={res}
                            type="button"
                            className={`btn-chip ${youtubeResolution === res ? 'selected' : ''}`}
                            onClick={() => setYoutubeResolution(res)}
                            disabled={isProcessing}
                          >
                            {res === '1080p' ? '1080p (Full HD - Best Quality)' : (res === '720p' ? '720p (HD - Fast Download)' : res)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      className="btn btn-primary"
                      onClick={handleYoutubeDownloadSubmit}
                      disabled={!youtubeUrl.trim() || isProcessing}
                      style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #ef4444, #8b5cf6)' }}
                    >
                      <Download size={18} />
                      {isProcessing ? 'Processing Pipeline...' : `Download ${youtubeResolution} & Start AI Story Detection`}
                    </button>
                  </div>
                )}

                {/* Comprehensive Real-Time Pipeline Progress Dashboard */}
                {isProcessing && (
                  <div className="pipeline-dashboard-card">
                    <div className="pipeline-top-info">
                      <div>
                        <span className="progress-badge-active" style={{ marginBottom: 6 }}>
                          <span className="pulse-dot-blue"></span> Active Pipeline
                        </span>
                        <div className="pipeline-video-title">
                          🎬 {activeJob ? activeJob.title : (uploadFile ? uploadFile.name : 'Processing Video')}
                        </div>
                      </div>
                      <div className="pipeline-percentage">
                        {uploadProgress}%
                      </div>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
                      {processingStatus}
                    </p>

                    <div className="progress-bar-track" style={{ height: 10 }}>
                      <div
                        className="progress-bar-fill"
                        style={{ width: `${Math.max(uploadProgress, 4)}%` }}
                      ></div>
                    </div>

                    {/* 4-Stage Visual Stepper */}
                    <div className="pipeline-stepper">
                      <div className={`stepper-card ${uploadProgress >= 35 ? 'completed' : 'active'}`}>
                        <div className="stepper-top-row">
                          <span>STAGE 1</span>
                          <span>{uploadProgress >= 35 ? '✓ Done' : 'In Progress'}</span>
                        </div>
                        <div className="stepper-title">
                          {uploadMode === 'youtube' ? 'Download Stream' : 'File Upload'}
                        </div>
                        <div className="stepper-subtitle">
                          {uploadMode === 'youtube' ? `${youtubeResolution} Video` : (activeJob?.loadedMB ? `${activeJob.loadedMB} / ${activeJob.totalMB} MB` : 'Up to 1.5 GB')}
                        </div>
                      </div>

                      <div className={`stepper-card ${uploadProgress >= 60 ? 'completed' : (uploadProgress >= 35 ? 'active' : 'pending')}`}>
                        <div className="stepper-top-row">
                          <span>STAGE 2</span>
                          <span>{uploadProgress >= 60 ? '✓ Done' : (uploadProgress >= 35 ? 'In Progress' : 'Pending')}</span>
                        </div>
                        <div className="stepper-title">Audio Track</div>
                        <div className="stepper-subtitle">16kHz Mono WAV</div>
                      </div>

                      <div className={`stepper-card ${uploadProgress >= 85 ? 'completed' : (uploadProgress >= 60 ? 'active' : 'pending')}`}>
                        <div className="stepper-top-row">
                          <span>STAGE 3</span>
                          <span>{uploadProgress >= 85 ? '✓ Done' : (uploadProgress >= 60 ? 'In Progress' : 'Pending')}</span>
                        </div>
                        <div className="stepper-title">Faster-Whisper</div>
                        <div className="stepper-subtitle">INT8 Timestamps</div>
                      </div>

                      <div className={`stepper-card ${uploadProgress >= 100 ? 'completed' : (uploadProgress >= 85 ? 'active' : 'pending')}`}>
                        <div className="stepper-top-row">
                          <span>STAGE 4</span>
                          <span>{uploadProgress >= 100 ? '✓ Done' : (uploadProgress >= 85 ? 'In Progress' : 'Pending')}</span>
                        </div>
                        <div className="stepper-title">Viral Moments</div>
                        <div className="stepper-subtitle">6-Dimension Scores</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: VIRAL MOMENTS & BATCH SCHEDULING */}
          {activeTab === 'clips' && (
            <div>
              {/* Header with Project Selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>
                    Distinct Viral Moments for: {selectedVideo ? selectedVideo.filename : 'No Video Selected'}
                  </h2>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                    Every moment is a complete story arc with visual chart / whiteboard awareness
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <select
                    className="form-control"
                    style={{ width: 240 }}
                    value={selectedVideo?.id || ''}
                    onChange={(e) => {
                      const v = videos.find(x => x.id === e.target.value);
                      setSelectedVideo(v);
                      loadClipsForVideo(v.id);
                    }}
                  >
                    {videos.map(v => (
                      <option key={v.id} value={v.id}>{v.filename}</option>
                    ))}
                  </select>

                  <button className="btn btn-secondary btn-sm" onClick={handleRedetectClips} title="Re-scan transcript">
                    <RefreshCw size={14} /> Re-detect
                  </button>
                </div>
              </div>

              {/* BATCH ACTION TOOLBAR */}
              {clips.length > 0 && (
                <div className="batch-toolbar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={selectedClipIds.length === clips.length ? deselectAllClips : selectAllClips}
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {selectedClipIds.length === clips.length ? (
                        <>
                          <CheckSquare size={16} color="#3b82f6" /> Deselect All
                        </>
                      ) : (
                        <>
                          <Square size={16} /> Select All ({clips.length})
                        </>
                      )}
                    </button>

                    <span style={{ fontSize: 13, fontWeight: 700, color: '#f0f3fa' }}>
                      {selectedClipIds.length > 0
                        ? `${selectedClipIds.length} of ${clips.length} moments selected`
                        : `Select moments to upload or schedule`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    {/* Schedule Batch Release Button */}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowScheduleModal(true)}
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none' }}
                    >
                      <Calendar size={15} />
                      {selectedClipIds.length > 0
                        ? `Schedule Selected (${selectedClipIds.length})`
                        : `Schedule All (${clips.length})`}
                    </button>

                    {/* Fast Upload Selected Button */}
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleBatchScheduleSubmit()}
                      disabled={isBatchPublishing}
                    >
                      <Youtube size={15} />
                      {isBatchPublishing
                        ? 'Publishing...'
                        : (selectedClipIds.length > 0
                            ? `Upload Selected (${selectedClipIds.length})`
                            : `Upload All (${clips.length})`)}
                    </button>
                  </div>
                </div>
              )}

              {/* Clips Grid */}
              {clips.length === 0 ? (
                <div className="editor-form" style={{ textAlign: 'center', padding: 48 }}>
                  <Flame size={48} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <h3>No Viral Clips Found Yet</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Upload a video or click "Re-detect Moments" above.</p>
                </div>
              ) : (
                <div className="clips-grid">
                  {clips.map((clip, idx) => {
                    const isSelected = selectedClipIds.includes(clip.id);
                    return (
                      <div
                        key={clip.id}
                        className="clip-card"
                        style={{
                          border: isSelected ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                          boxShadow: isSelected ? '0 0 16px rgba(59, 130, 246, 0.25)' : 'none'
                        }}
                      >
                        <div>
                          <div className="clip-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              {/* Selection Checkbox */}
                              <input
                                type="checkbox"
                                className="batch-checkbox"
                                checked={isSelected}
                                onChange={() => toggleClipSelection(clip.id)}
                                title="Select this clip for batch upload"
                              />

                              <span className={`viral-badge ${clip.viral_score >= 70 ? 'high' : 'medium'}`}>
                                <Flame size={14} />
                                Score: {clip.viral_score}
                              </span>

                              {clip.has_visual && (
                                <span className="viral-badge" style={{ background: 'rgba(59, 130, 246, 0.18)', color: '#60a5fa', borderColor: 'rgba(59, 130, 246, 0.4)' }}>
                                  🎨 Visual Demo
                                </span>
                              )}
                            </div>

                            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                              ⏱️ {Math.floor(clip.start_time / 60)}m{Math.floor(clip.start_time % 60)}s → {Math.floor(clip.end_time / 60)}m{Math.floor(clip.end_time % 60)}s ({clip.duration.toFixed(1)}s)
                            </span>
                          </div>

                          <div className="clip-title" style={{ marginTop: 10 }}>{clip.title}</div>
                          <div className="clip-reason" style={{ marginTop: 4 }}>💡 {clip.reason}</div>

                          <div className="score-bars" style={{ marginTop: 12 }}>
                            <div className="score-item">
                              <div className="score-label-row">
                                <span>Hook</span>
                                <span>{clip.hook_score}</span>
                              </div>
                              <div className="score-track">
                                <div className="score-fill" style={{ width: `${clip.hook_score}%`, background: '#ef4444' }}></div>
                              </div>
                            </div>

                            <div className="score-item">
                              <div className="score-label-row">
                                <span>Story</span>
                                <span>{clip.storytelling_score}</span>
                              </div>
                              <div className="score-track">
                                <div className="score-fill" style={{ width: `${clip.storytelling_score}%`, background: '#8b5cf6' }}></div>
                              </div>
                            </div>
                          </div>

                          <div className="clip-text" style={{ marginTop: 12 }}>
                            "{clip.transcript_text}"
                          </div>
                        </div>

                        <div className="clip-actions" style={{ flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1 }}
                              onClick={() => handleRenderShort(clip.id)}
                              disabled={renderingClipId === clip.id}
                            >
                              <Sparkles size={14} />
                              {renderingClipId === clip.id ? 'Rendering 9:16...' : (clip.output_path ? 'Re-Render' : 'Render 9:16')}
                            </button>

                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                selectClipForPreview(clip);
                                setActiveTab('editor');
                              }}
                            >
                              <Eye size={14} />
                              Preview
                            </button>

                            {/* Direct Upload Button for this clip */}
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handlePublishYouTube(clip.id)}
                              disabled={isPublishing || !clip.output_path}
                              title="Upload directly to PDX channel"
                            >
                              <Youtube size={14} />
                              Upload
                            </button>
                          </div>

                          {clip.output_path && (
                            <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600, textAlign: 'center' }}>
                              ✓ 9:16 Rendered & Ready to Publish
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SHORTS EDITOR & PREVIEW */}
          {activeTab === 'editor' && (
            <div>
              {!selectedClip ? (
                <div className="editor-form" style={{ textAlign: 'center', padding: 48 }}>
                  <p>Select a clip from the Viral Moments tab to edit and preview.</p>
                </div>
              ) : (
                <div>
                  {/* Clip Switcher Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '12px 18px', borderRadius: 12, marginBottom: 24, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Current Clip:</span>
                      <select
                        className="form-control"
                        style={{ width: 340 }}
                        value={selectedClip.id}
                        onChange={(e) => {
                          const c = clips.find(x => x.id === e.target.value);
                          if (c) selectClipForPreview(c);
                        }}
                      >
                        {clips.map((c, i) => (
                          <option key={c.id} value={c.id}>
                            Moment #{i + 1} ({Math.floor(c.start_time / 60)}m{Math.floor(c.start_time % 60)}s → {Math.floor(c.end_time / 60)}m{Math.floor(c.end_time % 60)}s): {c.title.slice(0, 32)}...
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Clip Duration: <strong style={{ color: '#fff' }}>{selectedClip.duration.toFixed(1)}s</strong> (from {selectedClip.start_time.toFixed(1)}s to {selectedClip.end_time.toFixed(1)}s)
                    </div>
                  </div>

                  <div className="shorts-editor-view">
                    {/* Left: 9:16 Video Mockup */}
                    <div>
                      <div className="shorts-phone-mockup">
                        {selectedClip.output_path ? (
                          <video
                            key={`${selectedClip.id}_${selectedClip.rendered_at || ''}`}
                            className="shorts-video-player"
                            controls
                            autoPlay
                            loop
                            src={`${API_BASE}/api/clips/${selectedClip.id}/video?t=${new Date(selectedClip.rendered_at || Date.now()).getTime()}`}
                          />
                        ) : (
                          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                            <Play size={40} style={{ margin: '0 auto 12px' }} />
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>This clip has not been rendered yet.</p>
                            <p style={{ fontSize: 12, marginTop: 8 }}>Click <strong>"Render 9:16 Short"</strong> on the right to center the speaker and add animated subtitles.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Metadata & Rendering Controls */}
                    <div className="editor-form">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700 }}>9:16 Short Configuration</h2>
                        <span className="viral-badge high">Viral Score: {selectedClip.viral_score}</span>
                      </div>

                      <div className="form-group">
                        <label>YouTube Short Title (under 60 chars with #Shorts for mobile discovery)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label>YouTube High-Engagement Description & Hashtags</label>
                        <textarea
                          className="form-control"
                          style={{ minHeight: 140 }}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                          <label>Vertical 9:16 Layout</label>
                          <select
                            className="form-control"
                            value={editLayout}
                            onChange={(e) => setEditLayout(e.target.value)}
                          >
                            <option value="auto">⚡ Auto-Detect (Best for Whiteboards & Charts)</option>
                            <option value="blur_background">🌟 Blurred Background (Fit & Center 9:16)</option>
                            <option value="smart_crop">🎯 Smart Crop (Speaker Centered 9:16)</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>YouTube Privacy</label>
                          <select
                            className="form-control"
                            value={privacyStatus}
                            onChange={(e) => setPrivacyStatus(e.target.value)}
                          >
                            <option value="public">Public</option>
                            <option value="unlisted">Unlisted (Verify First)</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                      </div>

                      {/* Optional Custom Schedule Time for Single Clip */}
                      <div className="form-group">
                        <label>📅 Schedule Release Time (Optional — leave empty for immediate publish)</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={singleScheduleTime}
                          onChange={(e) => setSingleScheduleTime(e.target.value)}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleRenderShort(selectedClip.id)}
                          disabled={renderingClipId === selectedClip.id}
                        >
                          <Sparkles size={16} />
                          {renderingClipId === selectedClip.id ? 'Rendering 9:16 Short...' : 'Render 9:16 Short'}
                        </button>

                        {selectedClip.output_path && (
                          <a
                            className="btn btn-secondary"
                            href={`${API_BASE}/api/clips/${selectedClip.id}/video`}
                            download={`Short_${selectedClip.id}.mp4`}
                          >
                            <Download size={16} />
                            Download MP4
                          </a>
                        )}

                        <button
                          className="btn btn-success"
                          onClick={() => handlePublishYouTube(selectedClip.id, singleScheduleTime ? new Date(singleScheduleTime).toISOString() : null)}
                          disabled={isPublishing || !selectedClip.output_path}
                        >
                          <Youtube size={16} />
                          {isPublishing ? 'Uploading to YouTube...' : (singleScheduleTime ? 'Schedule to YouTube' : 'Publish to YouTube')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: YOUTUBE PUBLISHER & HISTORY */}
          {activeTab === 'youtube' && (
            <div className="editor-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>YouTube Shorts Publishing Log</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                    Audit trail of all published and scheduled Shorts on channel: <strong>{analytics.channel_info?.name || 'Connected Channel'}</strong>
                  </p>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={fetchYouTubeUploads}>
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {/* Informational Alert if Daily Limit Exceeded */}
              {uploads.some(u => (u.error_message || '').includes('uploadLimitExceeded')) && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    ⚠️ YouTube Daily Upload Quota Limit Reached
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Google has a strict limit on brand new channels (around 3 to 10 videos per day) until the channel is verified.
                    To unlock 50+ to 100 daily Shorts uploads:
                  </p>
                  <ol style={{ paddingLeft: 18, marginTop: 6, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <li>Go to <strong>YouTube Studio &gt; Settings &gt; Channel &gt; Feature eligibility</strong></li>
                    <li>Verify your <strong>Phone Number</strong> under <em>Intermediate features</em>.</li>
                    <li>Enable <em>Advanced features</em> (via video verification or 2 months of channel history).</li>
                  </ol>
                  <div style={{ marginTop: 8 }}>
                    <a
                      href="https://studio.youtube.com/channel/UC/editing/details"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#60a5fa', fontWeight: 600 }}
                    >
                      Open YouTube Studio Feature Eligibility ↗
                    </a>
                  </div>
                </div>
              )}

              {uploads.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>No Shorts uploaded to YouTube yet.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Privacy</th>
                      <th>Status / Reason</th>
                      <th>Scheduled Release</th>
                      <th>YouTube Link</th>
                      <th>Uploaded At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploads.map((u) => (
                      <tr key={u.id}>
                        <td style={{ fontWeight: 600 }}>{u.title}</td>
                        <td>{u.privacy_status}</td>
                        <td>
                          <span style={{ color: u.upload_status === 'published' ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                            {u.upload_status === 'published' ? '✓ Published' : '✕ Failed'}
                          </span>
                          {u.error_message && (
                            <div style={{ fontSize: 11, color: '#f87171', marginTop: 4, maxWidth: 220 }}>
                              {u.error_message.includes('uploadLimitExceeded')
                                ? '⚠️ Daily limit exceeded by YouTube (Verify channel phone number)'
                                : u.error_message.slice(0, 80)}
                            </div>
                          )}
                        </td>
                        <td style={{ color: u.scheduled_publish_at ? '#60a5fa' : 'var(--text-muted)' }}>
                          {u.scheduled_publish_at ? `📅 ${new Date(u.scheduled_publish_at).toLocaleString()}` : 'Immediate'}
                        </td>
                        <td>
                          {u.youtube_url ? (
                            <a href={u.youtube_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600 }}>
                              {u.youtube_video_id} ↗
                            </a>
                          ) : '-'}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{u.uploaded_at || u.created_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </main>

      {/* SCHEDULE & BATCH UPLOAD MODAL WITH 9:16 LAYOUT CONTROL */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => !isBatchPublishing && setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>📅 Automated YouTube Batch Scheduler</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 2 }}>
                  Publish {selectedClipIds.length > 0 ? selectedClipIds.length : clips.length} Shorts to <strong>{analytics.channel_info?.name || 'Your YouTube Channel'}</strong> on an automatic schedule.
                </p>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowScheduleModal(false)}
                disabled={isBatchPublishing}
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Batch Upload Progress Tracker */}
            {isBatchPublishing && (
              <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 10, marginBottom: 18, border: '1px solid rgba(59, 130, 246, 0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="pulse-dot-blue"></span>
                    <strong style={{ fontSize: 13, color: '#60a5fa' }}>{batchProgressText}</strong>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                    {activeJob ? activeJob.percent : 0}%
                  </span>
                </div>

                <div className="progress-bar-track" style={{ height: 8, marginBottom: 12 }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.max(activeJob ? activeJob.percent : 0, 4)}%` }}
                  ></div>
                </div>

                {activeJob && activeJob.subItems && (
                  <div className="batch-queue-container">
                    {activeJob.subItems.map((item, idx) => (
                      <div key={idx} className={`batch-queue-item ${item.status}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                          <span style={{ fontWeight: 700, color: item.status === 'completed' ? '#10b981' : (item.status === 'uploading' ? '#60a5fa' : 'var(--text-muted)') }}>
                            #{idx + 1}
                          </span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.title}
                          </span>
                        </div>
                        <div>
                          {item.status === 'completed' && <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Uploaded</span>}
                          {item.status === 'uploading' && <span style={{ color: '#60a5fa', fontWeight: 600 }}>⚡ Uploading...</span>}
                          {item.status === 'pending' && <span style={{ color: 'var(--text-muted)' }}>⏳ Waiting</span>}
                          {item.status === 'failed' && <span style={{ color: '#ef4444', fontWeight: 600 }}>⚠️ Failed</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vertical 9:16 Framing Layout Setting */}
            <div className="form-group" style={{ marginBottom: 16, background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Layers size={16} color="#3b82f6" />
                <label style={{ margin: 0, fontWeight: 700, color: '#f0f3fa' }}>
                  Vertical 9:16 Crop & Framing Layout
                </label>
              </div>
              <select
                className="form-control"
                value={batchLayoutMode}
                onChange={(e) => setBatchLayoutMode(e.target.value)}
                disabled={isBatchPublishing}
              >
                <option value="auto">⚡ Auto-Detect (Best: Keeps full Whiteboards & Charts visible with fit)</option>
                <option value="blur_background">🌟 Blurred Background (Fit & Center full 16:9 with ambient glow)</option>
                <option value="smart_crop">🎯 Smart Crop (Center-fill speaker in 9:16 vertical)</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input
                  type="checkbox"
                  id="batch-rerender-check"
                  className="batch-checkbox"
                  checked={batchForceRerender}
                  onChange={(e) => setBatchForceRerender(e.target.checked)}
                  disabled={isBatchPublishing}
                />
                <label htmlFor="batch-rerender-check" style={{ fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Re-render clips with this layout before publishing (ensures uniform layout across all selected)
                </label>
              </div>
            </div>

            {/* Interval Configuration */}
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>Publishing Interval (Minutes between each Short)</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {[15, 20, 30, 45, 60, 120].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    className={`btn-chip ${scheduleInterval === mins ? 'selected' : ''}`}
                    onClick={() => setScheduleInterval(mins)}
                    disabled={isBatchPublishing}
                  >
                    {mins === 30 ? '30 min (Recommended)' : `${mins} min`}
                  </button>
                ))}
              </div>
            </div>

            {/* Timing Options */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div className="form-group">
                <label>Release Sequence</label>
                <select
                  className="form-control"
                  value={scheduleStartNow ? 'now' : 'later'}
                  onChange={(e) => setScheduleStartNow(e.target.value === 'now')}
                  disabled={isBatchPublishing}
                >
                  <option value="now">⚡ First Short Immediate, then every {scheduleInterval}m</option>
                  <option value="later">⏳ All Shorts Scheduled at intervals</option>
                </select>
              </div>

              <div className="form-group">
                <label>Privacy on Release</label>
                <select
                  className="form-control"
                  value={privacyStatus}
                  onChange={(e) => setPrivacyStatus(e.target.value)}
                  disabled={isBatchPublishing}
                >
                  <option value="public">Public (Automatic YouTube Schedule)</option>
                  <option value="unlisted">Unlisted (Review in Studio)</option>
                </select>
              </div>
            </div>

            {/* Custom Start Time (Optional) */}
            <div className="form-group" style={{ marginBottom: 18 }}>
              <label>Optional: Start Schedule at Specific Time (Leave empty for right now)</label>
              <input
                type="datetime-local"
                className="form-control"
                value={customStartTime}
                onChange={(e) => setCustomStartTime(e.target.value)}
                disabled={isBatchPublishing}
              />
            </div>

            {/* Live Scheduled Timeline Preview */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
                🗓️ Calculated Schedule Timeline Preview:
              </label>
              <div className="schedule-timeline">
                {getTimelinePreview().map((item, idx) => (
                  <div key={idx} className={`timeline-item ${item.isImmediate ? 'active' : ''}`}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: '70%' }}>
                      <span style={{ fontWeight: 700, color: item.isImmediate ? '#10b981' : '#60a5fa' }}>
                        #{idx + 1}
                      </span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </span>
                    </div>
                    <div style={{ fontWeight: 600, color: item.isImmediate ? '#10b981' : '#fff' }}>
                      {item.isImmediate ? '🚀 Live Immediately' : `⏰ ${item.timeStr} (${item.dateStr})`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {batchResults && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: '#10b981', marginBottom: 6 }}>
                  🎉 {batchResults.scheduled_count} Shorts Successfully Processed!
                </div>
                <div style={{ maxHeight: 120, overflowY: 'auto' }}>
                  {batchResults.results.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                      <span>{r.title?.slice(0, 36) || 'Short'}...</span>
                      <a href={r.youtube_url} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600 }}>
                        {r.scheduled_publish_at ? `Scheduled (${new Date(r.scheduled_publish_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : 'Live ↗'}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowScheduleModal(false)}
                disabled={isBatchPublishing}
              >
                Close
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleBatchScheduleSubmit()}
                disabled={isBatchPublishing}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
              >
                <Calendar size={16} />
                {isBatchPublishing ? 'Uploading & Scheduling...' : `Schedule to ${analytics.channel_info?.name || 'Channel'} (every ${scheduleInterval}m)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: YOUTUBE CHANNEL CONNECT WIZARD */}
      {showConnectModal && (
        <div className="modal-overlay" onClick={() => !isConnectingAuth && setShowConnectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 620 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Youtube size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800 }}>Connect Your YouTube Channel</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                    One-time setup using Google Cloud OAuth credentials to publish Shorts.
                  </p>
                </div>
              </div>
              <button
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                onClick={() => setShowConnectModal(false)}
                disabled={isConnectingAuth}
              >
                <X size={20} />
              </button>
            </div>

            {connectMessage && (
              <div style={{
                background: connectMessage.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${connectMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                color: connectMessage.type === 'success' ? '#10b981' : '#f87171'
              }}>
                {connectMessage.text}
              </div>
            )}

            {/* Step 1: Upload or Paste client_secrets.json */}
            <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong style={{ fontSize: 13 }}>Step 1: Provide client_secrets.json</strong>
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Get from Google Cloud Console <ExternalLink size={12} />
                </a>
              </div>

              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                Download your Desktop OAuth 2.0 Client credentials JSON from Google Cloud Console, then choose the file or paste its contents below:
              </p>

              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleSecretsFileUpload}
                  style={{ fontSize: 12 }}
                />
              </div>

              <textarea
                className="form-control"
                placeholder='Or paste the JSON contents here: { "installed": { "client_id": "...", ... } }'
                rows={4}
                value={secretsJsonInput}
                onChange={(e) => setSecretsJsonInput(e.target.value)}
                style={{ fontSize: 11, fontFamily: 'monospace', marginBottom: 10 }}
              />

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSaveClientSecrets}
                disabled={!secretsJsonInput.trim() || isSavingSecrets}
              >
                <Key size={14} /> {isSavingSecrets ? 'Saving...' : 'Save Credentials'}
              </button>
            </div>

            {/* Step 2: One-Click Authorize Channel */}
            <div style={{ background: 'var(--bg-secondary)', padding: 16, borderRadius: 10, border: '1px solid var(--border-color)', marginBottom: 18 }}>
              <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                Step 2: Authorize Your YouTube Channel
              </strong>
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Click below to open Google's sign-in page. Log in with your YouTube channel's Google account and click "Allow".
              </p>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartConnectAuth}
                  disabled={isConnectingAuth}
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                >
                  <ShieldCheck size={16} />
                  {isConnectingAuth ? 'Waiting for Sign-In in Browser...' : 'Authorize YouTube Channel'}
                </button>
                {isConnectingAuth && (
                  <span style={{ fontSize: 12, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="pulse-dot-blue"></span> Completing OAuth...
                  </span>
                )}
              </div>
            </div>

            {/* Desktop Terminal Shortcut */}
            <div style={{ padding: 12, background: 'rgba(59, 130, 246, 0.08)', borderRadius: 8, border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: 12, color: 'var(--text-secondary)' }}>
              💡 <strong>Quick Shortcut:</strong> You can also just double-click <strong>Connect_YouTube.bat</strong> in your project folder to sign in from your terminal at any time!
            </div>
          </div>
        </div>
      )}

      {/* FLOATING REAL-TIME ACTIVE JOB STATUS TRACKER (Visible Across All Tabs) */}
      {activeJob && (
        <div className="global-progress-bar-fixed">
          <div className="progress-header-row">
            <div className="progress-badge-active">
              <span className="pulse-dot-blue"></span>
              {activeJob.type === 'source_upload' && 'Uploading Source Video'}
              {activeJob.type === 'youtube_download' && 'Downloading YouTube Video'}
              {activeJob.type === 'youtube_publish' && 'Uploading to YouTube'}
              {activeJob.type === 'youtube_batch' && 'Batch Uploading to YouTube'}
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#60a5fa' }}>
              {activeJob.percent}%
            </span>
          </div>

          <div className="progress-video-name" title={activeJob.title}>
            🎬 {activeJob.title}
          </div>

          <div className="progress-status-detail">
            {activeJob.statusText}
          </div>

          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${Math.max(activeJob.percent, 4)}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}
