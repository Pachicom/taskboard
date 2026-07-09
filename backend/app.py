from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app, supports_credentials=True)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///tasks.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'supersecretkey'
db = SQLAlchemy(app)

# Модель пользователя
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

# Модель задачи
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    status = db.Column(db.String(50), default="todo")
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def to_dict(self):
        return {"id": self.id, "title": self.title, "status": self.status}

with app.app_context():
    db.create_all()

# Регистрация
@app.route("/register", methods=["POST"])
def register():
    data = request.json
    if User.query.filter_by(username=data["username"]).first():
        return jsonify({"error": "User exists"}), 400
    hashed_pw = generate_password_hash(data["password"])
    user = User(username=data["username"], password=hashed_pw)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Registered"}), 201

# Логин
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(username=data["username"]).first()
    if user and check_password_hash(user.password, data["password"]):
        session["user_id"] = user.id
        return jsonify({"message": "Logged in"}), 200
    return jsonify({"error": "Invalid credentials"}), 401

# Логаут
@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user_id", None)
    return jsonify({"message": "Logged out"}), 200

# Получение задач
@app.route("/tasks", methods=["GET"])
def get_tasks():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    tasks = Task.query.filter_by(user_id=session["user_id"]).all()
    return jsonify([t.to_dict() for t in tasks])

# Добавление задачи
@app.route("/tasks", methods=["POST"])
def add_task():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    new_task = Task(title=data["title"], status="todo", user_id=session["user_id"])
    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.to_dict()), 201

# Обновление задачи
@app.route("/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    task = Task.query.filter_by(id=task_id, user_id=session["user_id"]).first()
    if not task:
        return jsonify({"error": "Not found"}), 404
    if "title" in data:
        task.title = data["title"]
    if "status" in data:
        task.status = data["status"]
    db.session.commit()
    return jsonify(task.to_dict())

# Удаление задачи
@app.route("/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401
    task = Task.query.filter_by(id=task_id, user_id=session["user_id"]).first()
    if not task:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Deleted"}), 200

if __name__ == "__main__":
    app.run(debug=True)
