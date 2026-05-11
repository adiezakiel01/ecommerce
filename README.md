To activate virtual environment: \
cd backend \
source venv/bin/activate

To run app: \
uvicorn app.main:app --reload

Docker: \
Starting a session: docker compose up -d db redis \
Ending a session: docker compose down
