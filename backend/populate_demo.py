from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import User, Repository, Report, Compares
from datetime import datetime

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def populate_demo_data():
    db = next(get_db())

    # --- 1. Add Users ---
    user1 = User(
        firstname="Alice",
        lastname="Smith",
        email="alice@example.com",
        password="password123",
        role="admin"
    )
    user2 = User(
        firstname="Bob",
        lastname="Johnson",
        email="bob@example.com",
        password="password456",
        role="user"
    )
    db.add_all([user1, user2])
    db.commit()

    # Refresh to get IDs
    db.refresh(user1)
    db.refresh(user2)

    # --- 2. Add Repositories ---
    repo1 = Repository(
        repo_link="https://github.com/alice/project1",
        owner=user1
    )
    repo2 = Repository(
        repo_link="https://github.com/bob/project2",
        owner=user2
    )
    db.add_all([repo1, repo2])
    db.commit()
    db.refresh(repo1)
    db.refresh(repo2)

    # --- 3. Add Reports ---
    report1 = Report(
        format="PDF",
        graph="graph1.png",
        chart="chart1.png",
        repository=repo1
    )
    report2 = Report(
        format="PNG",
        graph="graph2.png",
        chart="chart2.png",
        repository=repo2
    )
    db.add_all([report1, report2])
    db.commit()

    # --- 4. Add Compares (many-to-many) ---
    compare1 = Compares(user_id=user1.user_id, repo_id=repo2.repo_id)
    compare2 = Compares(user_id=user2.user_id, repo_id=repo1.repo_id)
    db.add_all([compare1, compare2])
    db.commit()

    print("Demo data populated successfully!")


if __name__ == "__main__":
    populate_demo_data()
