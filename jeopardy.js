let board = document.querySelector(".js-board");
let questionDisplayNode = document.querySelector(".js-question-display");
let questionTextNode = document.querySelector(".js-question-text");
let questionTimeLeftNode = document.querySelector(".js-question-time");
let scoreContainer = document.querySelector(".js-score");
let playerDataInQuestionBox = document.querySelector(".js-player-data-in-question");
let answerTextNode = document.querySelector(".js-answer-text");

let categoryList = null;
let questionLists = null;

let blockNewQuestions = false;
let questionStartTimestamp = null; // start viewing a question
let questionTimerId = null;
let currentQuestionValue = 0;

let players = [
    {
        name: "Player 1",
        score: 0,
        isSelected: false,
    },
    {
        name: "Player 2",
        score: 0,
        isSelected: false,
    },
    {
        name: "Player 3",
        score: 0,
        isSelected: false,
    },
];

const ACTIONS = {
    RIGHT: "RIGHT",
    WRONG: "WRONG",
    SHOW: "SHOW",
};

const QUESTION_STATES = {
    DONE: "DONE",
    ACTIVE: "ACTIVE",
    // undefined: not yet selected
};

// ****************  Initialization ***********************
function initialize() {
    // get categories
    fetch("https://opentdb.com/api_category.php")
        .then((x) => x.json())
        .then(categoriesLoaded);

    render();
}

function testInitialize() {
    questionLists = testQuestions;
    render();
}

/* **************** Rendering ************************** */
function render() {
    renderPlayers(scoreContainer);
    renderPlayers(playerDataInQuestionBox, true); // second argument adds click event listeners
    if (Array.isArray(questionLists)) {
        renderBoard();
    }
    if (questionStartTimestamp === null) {
        questionDisplayNode.classList.add("invisible");
    } else {
        questionDisplayNode.classList.remove("invisible");
    }
}

function renderPlayers(container, isClickable = false) {
    container.innerHTML = players
        .map(
            (player, index) => `
        <div>
            <div 
                class="player-container ${player.isSelected ? "selected" : isClickable ? "clickable" : ""}" 
                data-index="${index}">
                    <div class="player-name">${player.name}</div>
                    <div class="player-score">${player.score}</div>
            </div> 
            ${
                player.isSelected
                    ? `
            <div class="player-action-button-container">
                <button class="player-action-button green" onclick="actionButtonClicked('${ACTIONS.RIGHT}', ${index})">🗸</button>
                <button class="player-action-button red" onclick="actionButtonClicked('${ACTIONS.WRONG}', ${index})">✗</button>
                <button class="player-action-button" onclick="actionButtonClicked('${ACTIONS.SHOW}', ${index})">👁</button>
            </div>            
            `
                    : ""
            }
        </div>
    `
        )
        .join("\n");
}

function renderQuestions(questionsList, columnIndex) {
    let html = "";
    for (let i = 0; i < questionsList.length; i++) {
        let question = questionsList[i];
        let score = 100 * (i + 1);

        if (typeof question.state === "undefined") {
            html += `
                <div class="js-question question cell">
                    <div 
                        class="js-face-value face-value" 
                        data-column="${columnIndex}" 
                        data-row="${i}">
                        ${score}
                    </div>
                    <div class="question-text invisible">${question.question}</div>
                </div>
            `;
        } else if (question.state === QUESTION_STATES.DONE) {
            html += `
                <div class="js-question question cell">
                    <div class="js-question-done"></div>
                    <div class="question-text invisible">${question.question}</div>
                </div>
            `;
        } else if (question.state === QUESTION_STATES.ACTIVE) {
            html += `
                <div class="js-question question cell">
                    <div class="js-question-done">
                        ?
                    </div>
                    <div class="question-text invisible">${question.question}</div>
                </div>
            `;
        }
    }
    return html;
}

function renderBoard() {
    let html = "";
    for (let i = 0; i < questionLists.length; i++) {
        let list = questionLists[i];
        html += `
            <section class="topic-container">
                <div class="topic-name cell">${list[0].category}</div>
                ${renderQuestions(list, i)}
            </section>`;
    }

    board.innerHTML = html;
}

// players
function renderPlayerClassList(isClickable, isSelected) {
    return `
        player-container 
        ${isSelected ? "selected" : isClickable ? "clickable" : ""}
    `.replaceAll("\n", "");
}

function selectCategories(n) {
    let numOfCategories = categoryList.length;
    if (n > numOfCategories) {
        n = numOfCategories;
    }
    let categorySet = new Set();

    while (categorySet.size < n) {
        let index = Math.floor(Math.random() * numOfCategories);
        categorySet.add(index);
    }

    return [...categorySet].map((index) => categoryList[index]);
}

function questionsRetrieved(response) {
    questionLists = response.filter((x) => x.status === "fulfilled").map((x) => x.value.results);
    render();
}

function retrieveQuestions(selectedCategories) {
    Promise.allSettled(
        selectedCategories.map((category) =>
            fetch(`https://opentdb.com/api.php?amount=5&category=${category.id}`).then((x) => x.json())
        )
    ).then(questionsRetrieved);
}

function categoriesLoaded(categories) {
    categoryList = categories.trivia_categories;

    let selectedCategories = selectCategories(6);
    retrieveQuestions(selectedCategories);
}

// Event handling - gameplay
function getTargetNodeFromEvent(event) {
    // navigate to the target node with data-row, data-column attributes
    let targetNode = event.target;
    if (targetNode.classList.contains("js-question")) {
        let questionIdNode = targetNode.querySelector(".js-face-value");
        if (questionIdNode !== null) {
            targetNode = questionIdNode;
        } else {
            targetNode = null;
        }
    } else if (!targetNode.classList.contains("js-face-value")) {
        targetNode = null;
    }

    return targetNode;
}

function deselectAllPlayers() {
    for (let player of players) {
        player.isSelected = false;
    }
}

function endQuestion() {
    clearInterval(questionTimerId);

    deselectAllPlayers();
    questionStartTimestamp = null;
    currentQuestionValue = 0;
    blockNewQuestions = false;
    answerTextNode.innerText = "";

    render();
}

function questionTick() {
    let currentTimestamp = new Date().getTime();
    let timeElapsed = currentTimestamp - questionStartTimestamp;
    let numberOfDots = Math.max(0, Math.round(((10000 - timeElapsed) / 10000) * 20));
    let dots = new Array(numberOfDots).fill("•").join("");
    questionTimeLeftNode.innerHTML = dots;

    // Time is up
    if (numberOfDots === 0) {
        endQuestion();
    }
}

function showQuestion(currentQuestion) {
    questionTextNode.innerHTML = currentQuestion.question;
    questionTextNode.dataset.answer = currentQuestion.correct_answer;
    questionStartTimestamp = new Date().getTime();
    questionTimerId = setInterval(questionTick, 100);

    render();
}

function selectQuestion(targetNode) {
    let rowIndex = targetNode.dataset.row;
    let columnIndex = targetNode.dataset.column;
    currentQuestionValue = Number.parseInt(targetNode.innerText);

    questionLists[columnIndex][rowIndex].state = QUESTION_STATES.ACTIVE;
    render();

    blockNewQuestions = true;

    setTimeout(() => {
        targetNode.innerHTML = "";
        questionLists[columnIndex][rowIndex].state = QUESTION_STATES.DONE;
        showQuestion(questionLists[columnIndex][rowIndex]);
    }, 1000);
}

function boardClicked(event) {
    if (blockNewQuestions) return;

    let targetNode = getTargetNodeFromEvent(event);

    if (targetNode !== null) {
        selectQuestion(targetNode);
    }
}

// Player action
function getTargetPlayerFromEvent(event) {
    for (let i = 0; i < players.length; i++) {
        if (playerDataInQuestionBox.children[i].contains(event.target)) {
            return i;
        }
    }
    return null;
}

function playerAnswerIndicated(event) {
    if (players.some((player) => player.isSelected)) return; // if a player is answering, don't allow clicks
    let targetPlayer = getTargetPlayerFromEvent(event);
    if (typeof targetPlayer === "number") {
        players[targetPlayer].isSelected = true;
        render();
    }
}

// ****************** ACtion Handlers ***********************
function actionButtonClicked(action, playerIndex) {
    switch (action) {
        case ACTIONS.RIGHT:
            players[playerIndex].score += currentQuestionValue;
            endQuestion();
            break;
        case ACTIONS.WRONG:
            players[playerIndex].score -= currentQuestionValue;
            endQuestion();
            break;
        case ACTIONS.SHOW:
            answerTextNode.innerText = questionTextNode.dataset.answer;
            break;
    }
}

// ****************** Action Listeners **********************
board.addEventListener("click", boardClicked);
playerDataInQuestionBox.addEventListener("click", playerAnswerIndicated);

initialize();
