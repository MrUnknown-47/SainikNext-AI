import logging

logger = logging.getLogger(__name__)

class JobProcessor:
    """Isolates purely data normalization resolving tight coupling logically."""
    
    @staticmethod
    def normalize_rapidapi_jobs(raw_data: list, role: str) -> list:
        normalized_jobs = []
        for item in raw_data:
            # Safely skip null items
            if not isinstance(item, dict):
                continue
                
            normalized_jobs.append({
                "title": item.get('job_title', 'Unknown Title'),
                "company": item.get('employer_name', 'Unknown Company'),
                "location": item.get('job_city') or item.get('job_country') or 'Remote',
                "link": item.get('job_apply_link', '#'),
                "role": role 
            })
        logger.info(f"JobProcessor successfully normalized {len(normalized_jobs)} raw integration targets seamlessly for '{role}'.")
        return normalized_jobs
