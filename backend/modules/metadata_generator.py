import re
from typing import Dict, Any, List, Optional

DEFAULT_HASHTAGS = [
    "#Shorts",
    "#ShortCutAI",
    "#Mindset",
    "#SelfImprovement",
    "#ViralShorts",
    "#Tips",
    "#Motivation"
]

TOPIC_KEYWORDS = {
    "habit": ["#Habits", "#AtomicHabits", "#BehaviorChange", "#BrainLoop"],
    "brain": ["#Neuroscience", "#BrainHacks", "#CognitiveScience", "#PsychologyFacts"],
    "mind": ["#Mindset", "#MentalModels", "#Focus", "#DeepWork"],
    "trick": ["#LifeHacks", "#ProductivityHacks", "#SelfImprovement", "#SuccessTips"],
    "learn": ["#Learning", "#VisualLearning", "#Whiteboard", "#Science"],
    "ai": ["#AI", "#ArtificialIntelligence", "#Tech", "#Future"],
    "business": ["#Business", "#Entrepreneur", "#Success", "#Money"],
    "podcast": ["#Podcast", "#Interview", "#Mindset", "#Wisdom"]
}

BASE_SEO_TAGS = [
    "shorts", "youtube shorts", "viral shorts", "mindset", "psychology",
    "self improvement", "productivity", "storytelling", "daily shorts",
    "podcast clips", "viral moments", "ShortCut AI"
]

def generate_shorts_metadata(
    clip_text: str,
    base_title: str = "",
    channel_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates high-engagement YouTube Shorts metadata tailored for the user's connected channel:
    - Punchy, high-CTR Title (< 60 chars with #Shorts)
    - Rich, structured Description with hook, core takeaways, and CTA
    - Curated Hashtags (#Shorts, #ShortCutAI, topic tags)
    - Comprehensive SEO Search Tags
    """
    if not channel_name:
        try:
            from backend.modules.youtube_upload import get_youtube_uploader
            profile = get_youtube_uploader().get_channel_profile()
            ch = profile.get("name")
            channel_name = ch if ch and ch != "Not Connected" else "this channel"
        except Exception:
            channel_name = "this channel"

    # 1. Clean & Optimize Title
    title = base_title.strip() if base_title else "Must-Watch Highlight!"
    if not title.endswith("!") and not title.endswith("?"):
        title += "!"

    # Append #Shorts to title if space permits (< 60 chars)
    if len(title) <= 50 and "#shorts" not in title.lower():
        title = f"{title} #Shorts"

    # 2. Extract Topic Hashtags
    text_lower = clip_text.lower()
    custom_hashtags = list(DEFAULT_HASHTAGS)

    for keyword, tags in TOPIC_KEYWORDS.items():
        if keyword in text_lower:
            for t in tags:
                if t not in custom_hashtags:
                    custom_hashtags.append(t)

    hashtags_str = " ".join(custom_hashtags[:8])

    # 3. Build Topic-Aware Tags for YouTube Tag List
    seo_tags = list(BASE_SEO_TAGS)
    if channel_name and channel_name != "this channel":
        seo_tags.insert(0, channel_name)
    for word in ["dopamine", "routine", "cue", "reward", "discipline", "subconscious"]:
        if word in text_lower and word not in seo_tags:
            seo_tags.append(word)

    # 4. Generate High-Retention Rich Description
    sentences = [s.strip() for s in re.split(r'[.!?]+', clip_text.strip()) if len(s.strip()) > 10]
    hook_sentence = sentences[0] if sentences else "Watch this key moment until the end!"
    summary_sentence = sentences[1] if len(sentences) > 1 else "Broken down into a concise, high-impact Short."
    takeaway_sentence = sentences[2] if len(sentences) > 2 else "Save this insight and share with someone who needs it."

    description = f"""{hook_sentence}! ⚡

{summary_sentence}

Key Takeaways:
• {takeaway_sentence}
• Watch till the end for the complete punchline

💡 Subscribe to {channel_name} for daily high-impact Shorts!

{hashtags_str}

---
Automated with ShortCut AI
"""

    return {
        "title": title[:100],
        "description": description.strip(),
        "hashtags": hashtags_str,
        "tags": seo_tags[:25],
        "category": "Entertainment"
    }
