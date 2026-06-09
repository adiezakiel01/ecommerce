To activate virtual environment: \
cd backend \
source venv/bin/activate

To run backend app: \
uvicorn app.main:app --reload

To run frontend app: \
cd ~/Documents/ecom/frontend \
npm run dev

Docker: \
Starting a session: docker compose up -d db redis \
Ending a session: docker compose down
