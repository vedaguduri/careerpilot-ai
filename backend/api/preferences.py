from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from database import get_session
from models.user import User
from models.preference import UserPreference, UserPreferenceUpdate
from api.auth import get_current_user

router = APIRouter(prefix="/preferences", tags=["Preferences"])

@router.get("", response_model=UserPreference)
def get_user_preferences(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    pref = session.exec(select(UserPreference).where(UserPreference.user_id == current_user.id)).first()
    if not pref:
        pref = UserPreference(
            user_id=current_user.id,
            desired_roles=["Software Engineer"],
            preferred_locations=["Remote"]
        )
        session.add(pref)
        session.commit()
        session.refresh(pref)
    return pref

@router.put("", response_model=UserPreference)
def update_user_preferences(
    update_data: UserPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    pref = session.exec(select(UserPreference).where(UserPreference.user_id == current_user.id)).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)
        session.add(pref)
        
    for k, v in update_data.model_dump(exclude_unset=True).items():
        setattr(pref, k, v)
        
    session.add(pref)
    session.commit()
    session.refresh(pref)
    return pref
