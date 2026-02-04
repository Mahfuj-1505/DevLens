#!/bin/bash

# DevLens - Quick Start Script
# This script starts both backend and frontend servers

echo "🚀 Starting DevLens Application"
echo "================================"
echo ""

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Error: backend directory not found"
    echo "Please run this script from the DevLens root directory"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found"
    echo "Please run this script from the DevLens root directory"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

# Trap CTRL+C
trap cleanup SIGINT SIGTERM

# Start Backend
echo "📦 Starting Backend Server..."
cd backend

# Activate virtual environment and start server
if [ -d "venv" ]; then
    source venv/bin/activate
    python server.py > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID)"
    echo "   Logs: backend.log"
    echo "   URL: http://localhost:8000"
    echo "   Docs: http://localhost:8000/docs"
else
    echo "❌ Virtual environment not found"
    echo "Please run: cd backend && ./scripts/setup.sh"
    exit 1
fi

cd ..

# Wait a moment for backend to start
sleep 2

# Start Frontend
echo ""
echo "🎨 Starting Frontend Server..."
cd frontend

if [ -d "node_modules" ]; then
    npm run dev > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
    echo "   Logs: frontend.log"
    echo "   URL: http://localhost:5173"
else
    echo "❌ node_modules not found"
    echo "Please run: cd frontend && npm install"
    kill $BACKEND_PID
    exit 1
fi

cd ..

echo ""
echo "🎉 DevLens is running!"
echo "================================"
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press CTRL+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
