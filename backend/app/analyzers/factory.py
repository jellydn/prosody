from typing import Optional
from .base import SpeechAnalyzer
from .free import FreeAnalyzer


def get_analyzer(
    provider: str, api_key: Optional[str] = None, **kwargs
) -> SpeechAnalyzer:
    provider = provider.lower()

    if provider == "free":
        return FreeAnalyzer()
    elif provider == "azure":
        if not api_key:
            raise ValueError("API key is required for Azure provider")
        try:
            from .azure import AzureAnalyzer
        except ImportError as exc:
            raise ValueError("Azure provider dependencies are not installed") from exc
        return AzureAnalyzer(api_key=api_key, **kwargs)
    elif provider == "google":
        if not api_key:
            raise ValueError("API key is required for Google provider")
        try:
            from .google import GoogleAnalyzer
        except ImportError as exc:
            raise ValueError("Google provider dependencies are not installed") from exc
        return GoogleAnalyzer(api_key=api_key)
    elif provider == "openai":
        if not api_key:
            raise ValueError("API key is required for OpenAI provider")
        try:
            from .openai import OpenAIAnalyzer
        except ImportError as exc:
            raise ValueError("OpenAI provider dependencies are not installed") from exc
        return OpenAIAnalyzer(api_key=api_key)
    else:
        raise ValueError(f"Unknown provider: {provider}")
