from flask import Flask, jsonify, request, g
import sqlite3

app = Flask(__name__)
DATABASE = 'questions.db'


# Function to fetch questions
def fetch_questions(user_id):
    return [
        {'question': "Are you satisfied with the in-game progression system and rewards?",
         'options': ["Very satisfied", "Satisfied", "Neutral", "Unsatisfied", "Very unsatisfied"],
         'question_id': "q1"},
        {
            'question' : "Which aspect of the game's progression system do you appreciate the most?",
            'options' : ["Character progression", "Unlockable content", "Achievements", "Skill progression", "Other"],
            'questions_id': "q2"},
        {
            'question' : "Do you feel a sense of achievement when you reach milestones or earn rewards in the game?",
            'options' : ["Yes, always", "Yes, sometimes", "No, not really", "Not sure"],
            'questions_id': "q3"},
        {
            'question' : "How do you rate the balance between challenging tasks and rewarding outcomes in the game?",
            'options' : ["Well-balanced", "Too easy to earn rewards", "Too difficult to earn rewards", "Not sure"],
            'questions_id': "q4"},
        {
            'question' : "Are there any specific in-game achievements or trophies that you're actively pursuing?",
            'options' : ["Yes", "No", "Not sure"],
            'questions_id': "q5"},
        {
            'question' : "Do you feel that the in-game economy (e.g., currency, items) is balanced and fair?",
            'options' : ["Yes", "No", "Not sure"],
            'questions_id': "q6"},
        {
            'question' : "Are you motivated to continue playing in order to achieve specific in-game goals or milestones?",
            'options' : ["Highly motivated", "Moderately motivated", "Not very motivated", "Not motivated at all"],
            'questions_id': "q7"},
        {
            'question' : "Would you like to see more variety in the types of rewards offered in the game?",
            'options' : ["Yes", "No", "Not sure"],
            'questions_id': "q8"},
        {
            'question' : "Do you have any suggestions for improving the game's progression system or rewards?",
            'options' : ["Yes", "No"],
            'questions_id': "q9"},
        {
            'question' : "Overall, how satisfied are you with the game's progression and reward system?",
            'options' : ["Very satisfied", "Satisfied", "Neutral", "Unsatisfied", "Very unsatisfied"],
            'questions_id': "q10"},
    ]


# Helper function to get a database connection
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(DATABASE)
        g.db.row_factory = sqlite3.Row
    return g.db


# Helper function to initialize the database
def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()


# Open a database connection before each request
@app.before_request
def before_request():
    g.db = get_db()


# Close the database connection after each request
@app.teardown_request
def teardown_request(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()


# Function to store answers in the database
def store_answers_in_db(user_id, answers):
    db = get_db()
    for answer in answers:
        question_id = answer['question_id']
        user_answer = answer['answer']
        db.execute('INSERT INTO user_answers (user_id, question_id, answer) VALUES (?, ?, ?)',
                   (user_id, question_id, user_answer))
    db.commit()


# Route to get questions and submit answers
@app.route('/questions/reward/<user_id>', methods=['GET'])
def reward_questions(user_id):
    if request.method == 'GET':
        # Fetch questions from the database or any other source
        questions = fetch_questions(user_id)
        return jsonify({'user_id': user_id, 'questions': questions})


@app.route('/questions/reward/<user_id>', methods=['POST'])
def reward_questions_answers(user_id):
    if request.method == 'POST':
        # Receive answers from the user and store them in the database
        answers = request.json.get('answers', [])
        store_answers_in_db(user_id, answers)
        return jsonify({'message': 'Answers submitted successfully'})



# Route to get all in-progress user answers (Admin view)
@app.route('/admin/inprogress', methods=['GET'])
def admin_inprogress():
    db = get_db()
    
    # Fetch in-progress answers
    try:
        cursor = db.execute('SELECT user_id, question_id, answer FROM user_answers WHERE approved = 0')
    
        inprogress_answers = [{'user_id': row['user_id'], 'question_id': row['question_id'], 'answer': row['answer']} for row in cursor.fetchall()]

        # Organize answers by user_id
        user_answers_dict = {}
        for answer in inprogress_answers:
            user_id = answer['user_id']
            question_id = answer['question_id']
            user_answers_dict.setdefault(user_id, []).append({'question_id': question_id, 'answer': answer['answer']})

        return jsonify({'inprogress_answers': user_answers_dict})
    except:
        return jsonify({'Message': "No user Exists"})


# Route to get all approved user answers (Admin view)
@app.route('/admin/approved', methods=['GET'])
def admin_approved():
    db = get_db()
    cursor = db.execute('SELECT user_id, question_id, answer FROM user_answers WHERE approved = 1')
    
    approved_answers = [{'user_id': row['user_id'], 'question_id': row['question_id'], 'answer': row['answer']} for row in cursor.fetchall()]

    # Organize answers by user_id
    user_answers_dict = {}
    for answer in approved_answers:
        user_id = answer['user_id']
        question_id = answer['question_id']
        user_answers_dict.setdefault(user_id, []).append({'question_id': question_id, 'answer': answer['answer']})

    return jsonify({'approved_answers': user_answers_dict})

# Route to get all denied user answers (Admin view)
@app.route('/admin/denied', methods=['GET'])
def admin_denied():
    db = get_db()
    cursor = db.execute('SELECT user_id, question_id, answer FROM user_answers WHERE approved = -1')
    
    denied_answers = [{'user_id': row['user_id'], 'question_id': row['question_id'], 'answer': row['answer']} for row in cursor.fetchall()]

    # Organize answers by user_id
    user_answers_dict = {}
    for answer in denied_answers:
        user_id = answer['user_id']
        question_id = answer['question_id']
        user_answers_dict.setdefault(user_id, []).append({'question_id': question_id, 'answer': answer['answer']})

    return jsonify({'denied_answers': user_answers_dict})

# Route to approve all user's answers
@app.route('/admin/approve/<user_id>', methods=['POST'])
def admin_approve_user_answers(user_id):
    db = get_db()
    # Update the 'approved' column for all answers submitted by the specified user
    db.execute('UPDATE user_answers SET approved = 1 WHERE user_id = ?', (user_id,))
    db.commit()
    return jsonify({'message': f'All answers for user {user_id} approved successfully'})

# Rename the new function to avoid conflicts
@app.route('/admin/deny/<user_id>', methods=['POST'])
def admin_deny_user_answers_new(user_id):
    db = get_db()
    try:
        # Update the 'approved' column to deny all answers submitted by the specified user
        db.execute('UPDATE user_answers SET approved = -1 WHERE user_id = ? AND approved = 0', (user_id,))
        db.commit()
        return jsonify({'message': f'All answers for user {user_id} denied successfully'})
    except Exception as e:
        return jsonify({'error': str(e)})





if __name__ == '__main__':
    app.run(debug=True)
