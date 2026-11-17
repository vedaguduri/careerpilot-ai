from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models.user import User
from models.ai_provider import AIProviderKey, AIProviderConfigInput, AIProviderResponse
from api.auth import get_current_user
from services.crypto_vault import vault
from ai_gateway.router import ai_router

router = APIRouter(prefix="/ai-providers", tags=["AI Providers"])

@router.get("/catalog")
def get_providers_catalog():
    """Returns the supported providers and their default capabilities."""
    return ai_router.CATALOG

@router.get("", response_model=List[AIProviderResponse])
def get_user_configured_providers(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    keys = session.exec(select(AIProviderKey).where(AIProviderKey.user_id == current_user.id)).all()
    return [
        AIProviderResponse(
            id=k.id,
            provider=k.provider,
            key_fingerprint=k.key_fingerprint,
            base_url=k.base_url,
            is_active=k.is_active,
            selected_models=k.selected_models or {},
            monthly_spend_limit_usd=k.monthly_spend_limit_usd,
            updated_at=k.updated_at
        )
        for k in keys
    ]

@router.post("", response_model=AIProviderResponse)
def save_provider_key(
    config_in: AIProviderConfigInput,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    provider_name = config_in.provider.lower()
    existing = session.exec(
        select(AIProviderKey)
        .where(AIProviderKey.user_id == current_user.id)
        .where(AIProviderKey.provider == provider_name)
    ).first()
    
    if not config_in.api_key and not existing:
        raise HTTPException(status_code=400, detail="API key is required for initial configuration.")
        
    encrypted_key = vault.encrypt_api_key(config_in.api_key) if config_in.api_key else existing.encrypted_api_key
    fingerprint = vault.generate_fingerprint(config_in.api_key) if config_in.api_key else existing.key_fingerprint

    if existing:
        existing.encrypted_api_key = encrypted_key
        existing.key_fingerprint = fingerprint
        existing.base_url = config_in.base_url or existing.base_url
        if config_in.selected_models is not None:
            existing.selected_models = config_in.selected_models
        if config_in.monthly_spend_limit_usd is not None:
            existing.monthly_spend_limit_usd = config_in.monthly_spend_limit_usd
        session.add(existing)
        session.commit()
        session.refresh(existing)
        target = existing
    else:
        target = AIProviderKey(
            user_id=current_user.id,
            provider=provider_name,
            encrypted_api_key=encrypted_key,
            key_fingerprint=fingerprint,
            base_url=config_in.base_url,
            selected_models=config_in.selected_models or {},
            monthly_spend_limit_usd=config_in.monthly_spend_limit_usd or 0.0
        )
        session.add(target)
        session.commit()
        session.refresh(target)

    return AIProviderResponse(
        id=target.id,
        provider=target.provider,
        key_fingerprint=target.key_fingerprint,
        base_url=target.base_url,
        is_active=target.is_active,
        selected_models=target.selected_models,
        monthly_spend_limit_usd=target.monthly_spend_limit_usd,
        updated_at=target.updated_at
    )

@router.delete("/{provider}")
def delete_provider_key(
    provider: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    existing = session.exec(
        select(AIProviderKey)
        .where(AIProviderKey.user_id == current_user.id)
        .where(AIProviderKey.provider == provider.lower())
    ).first()
    if existing:
        session.delete(existing)
        session.commit()
    return {"message": f"Provider {provider} removed successfully."}

@router.post("/test-connection")
async def test_provider_connection(
    config_in: AIProviderConfigInput,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    provider_name = config_in.provider.lower()
    plain_key = config_in.api_key
    
    if not plain_key:
        existing = session.exec(
            select(AIProviderKey)
            .where(AIProviderKey.user_id == current_user.id)
            .where(AIProviderKey.provider == provider_name)
        ).first()
        if existing:
            plain_key = vault.decrypt_api_key(existing.encrypted_api_key)
            
    if not plain_key and provider_name != "ollama":
        raise HTTPException(status_code=400, detail="No API key provided to test.")
        
    res = await ai_router.test_connection(provider_name, plain_key or "", config_in.base_url)
    return res

@router.get("/{provider}/models")
async def list_provider_models(
    provider: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    existing = session.exec(
        select(AIProviderKey)
        .where(AIProviderKey.user_id == current_user.id)
        .where(AIProviderKey.provider == provider.lower())
    ).first()
    
    plain_key = vault.decrypt_api_key(existing.encrypted_api_key) if existing else ""
    base_url = existing.base_url if existing else None
    
    models = await ai_router.list_models(provider.lower(), plain_key, base_url)
    return models

@router.post("/benchmark")
async def run_model_benchmark(
    payload: Dict[str, str],
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    """Executes a privacy-preserving synthetic benchmark on the selected model."""
    provider = payload.get("provider", "groq")
    model_id = payload.get("model_id", "llama-3.3-70b-versatile")
    
    existing = session.exec(
        select(AIProviderKey)
        .where(AIProviderKey.user_id == current_user.id)
        .where(AIProviderKey.provider == provider.lower())
    ).first()
    plain_key = vault.decrypt_api_key(existing.encrypted_api_key) if existing else ""
    
    benchmark = await ai_router.run_synthetic_benchmark(provider, model_id, plain_key)
    return benchmark
