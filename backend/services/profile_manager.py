import logging
from sqlalchemy.orm import Session
from database.db import User, Profile, Skill, ResumeData

logger = logging.getLogger(__name__)

class ProfileManager:
    def __init__(self, db_path: str = ""):
        # Ignore db_path since SQLAlchemy Engine mapping handles bounds autonomously inside db.py
        logger.info("SQLAlchemy ORM configured correctly across Profile configurations.")

    def create_profile(self, db: Session, user_id: int = None, email: str = "", name: str = "", army_role: str = "") -> int:
        try:
            if user_id:
                user = db.query(User).filter(User.id == user_id).first()
                if not user:
                    user = User(id=user_id, email=email, name=name)
                    db.add(user)
                    db.commit()
            else:
                user = User(email=email, name=name)
                db.add(user)
                db.commit()
                db.refresh(user)
            
            # Map default base profile iteratively mapped onto user bounds
            profile = db.query(Profile).filter(Profile.user_id == user.id).first()
            if not profile:
                profile = Profile(user_id=user.id, experience="", target_career="", army_role=army_role)
                db.add(profile)
                db.commit()
                db.refresh(profile)
                
                # Initialize empty explicit ResumeData matrix 
                resume = ResumeData(profile_id=profile.id, data={})
                db.add(resume)
                db.commit()
            return user.id
        except Exception as e:
            db.rollback()
            raise e

    def get_profile_by_email(self, db: Session, email: str) -> dict:
        try:
            user = db.query(User).filter(User.email == email).first()
            if not user:
                return None
                
            return self.get_profile(db, user.id)
        except Exception as e:
            raise e

    def get_profile(self, db: Session, user_id: int = 1) -> dict:
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return {}
            
            profile = db.query(Profile).filter(Profile.user_id == user_id).first()
            if not profile:
                return {
                    "id": user.id,
                    "experience": "",
                    "skills": [],
                    "target_career": "",
                    "army_role": "",
                    "resume_data": {},
                    "email": user.email,
                    "name": user.name
                }
                
            skills = [s.name for s in profile.skills]
            resume_data = profile.resume_data.data if profile.resume_data else {}
            
            return {
                "id": user.id,
                "experience": profile.experience or "",
                "skills": skills,
                "target_career": profile.target_career or "",
                "army_role": profile.army_role or "",
                "resume_data": resume_data,
                "email": user.email or "",
                "name": user.name or ""
            }
        except Exception as e:
            raise e

    def update_profile(self, db: Session, user_id: int, experience: str = None, skills: list = None, target_career: str = None, army_role: str = None, resume_data: dict = None, email: str = None, name: str = None):
        """Updates specific fields incrementally across ORM boundaries securely."""
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                self.create_profile(db=db, user_id=user_id, email=email or "", name=name or "")
                user = db.query(User).filter(User.id == user_id).first()
                
            if email is not None:
                user.email = email
            if name is not None:
                user.name = name
                
            profile = db.query(Profile).filter(Profile.user_id == user_id).first()
            if not profile:
                profile = Profile(user_id=user.id, experience="", target_career="", army_role=army_role or "")
                db.add(profile)
                db.commit()
                db.refresh(profile)

            # Append logic string mappings
            if experience:
                if profile.experience:
                    profile.experience += f" | {experience}"
                else:
                    profile.experience = experience
                    
            if target_career is not None:
                profile.target_career = target_career

            if army_role is not None:
                profile.army_role = army_role
                
            # Merge skills uniquely preventing duplicates natively by sweeping ORM structures iteratively
            if skills:
                existing_skills = [s.name for s in profile.skills]
                for skill_name in skills:
                    if skill_name not in existing_skills:
                        new_skill = Skill(profile_id=profile.id, name=skill_name)
                        db.add(new_skill)
                        
            # Override dictionary natively safely triggering dirty flags via SQLAlchemy JSON
            if resume_data is not None:
                resume_model = db.query(ResumeData).filter(ResumeData.profile_id == profile.id).first()
                if not resume_model:
                    resume_model = ResumeData(profile_id=profile.id, data=resume_data)
                    db.add(resume_model)
                else:
                    merged_data = resume_model.data.copy() if resume_model.data else {}
                    merged_data.update(resume_data)
                    resume_model.data = merged_data 
                    
            db.commit()
            logger.info(f"ORM Profile updated successfully matching explicit boundaries for user_id={user_id}")
        except Exception as e:
            db.rollback()
            raise e
