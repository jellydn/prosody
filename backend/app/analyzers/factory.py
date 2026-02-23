from typing import Optional
from .base import SpeechAnalyzer
from .free import FreeAnalyzer
from .azure import AzureAnalyzer
from .google import GoogleAnalyzer
from .openai import OpenAIAnalyzer


def get_analyzer(
    provider: str, api_key: Optional[str] = None, **kwargs
) -> SpeechAnalyzer:
    provider = provider.lower()

    if provider == "free":
        return FreeAnalyzer()
    elif provider == "azure":
        if not api_key:
            raise ValueError("API key is required for Azure provider")
        return AzureAnalyzer(api_key=api_key, **kwargs)
    elif provider == "google":
        if not api_key:
            raise ValueError("API key is required for Google provider")
        return GoogleAnalyzer(api_key=api_key)
    elif provider == "openai":
        if not api_key:
            raise ValueError("API key is required for OpenAI provider")
        return OpenAIAnalyzer(api_key=api_key)
    else:
        raise ValueError(f"Unknown provider: {provider}")
