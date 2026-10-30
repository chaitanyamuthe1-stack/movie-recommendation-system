.PHONY: setup run frontend test build up down clean secrets

setup:            ## Install backend + frontend dependencies
	python -m pip install -r requirements.txt
	cd frontend && npm install

run:              ## Start the FastAPI backend
	python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

frontend:         ## Start the Vite dev server
	cd frontend && npm run dev

test:             ## Run the pytest suite
	python -m pytest backend/tests/ -v

build:            ## Build the frontend for production
	cd frontend && npm run build

up:               ## Start the full stack in Docker (needs .env)
	docker compose up --build -d

down:
	docker compose down

secrets:          ## Scan the repo for leaked secrets
	bash scripts/check_secrets.sh

clean:
	find . -name "__pycache__" -type d -prune -exec rm -rf {} +
