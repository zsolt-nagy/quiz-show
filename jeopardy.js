let questionDisplayNode = document.querySelector(".js-question-display");
let questionTextNode = document.querySelector(".js-question-text");
let questionTimeLeftNode = document.querySelector(".js-question-time");
let scoreContainer = document.querySelector(".js-score");
let playerDataInQuestionBox = document.querySelector(".js-player-data-in-question");
let answerTextNode = document.querySelector(".js-answer-text");

let categoryList = null;

let gameBoard = null;

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

// ****************  Initialization ***********************
function initialize() {
    // get categories
    fetch("https://opentdb.com/api_category.php")
        .then((x) => x.json())
        .then(categoriesLoaded);

    render();
}

/* **************** Rendering ************************** */
function render() {
    renderPlayers(scoreContainer);
    renderPlayers(playerDataInQuestionBox, true); // second argument adds click event listeners
    if (gameBoard !== null) {
        gameBoard.renderBoard();
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
    let questionLists = response.filter((x) => x.status === "fulfilled").map((x) => x.value.results);
    gameBoard = new Board(questionLists, document.querySelector(".js-board"), showQuestion);
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
    gameBoard.unblockBoard();
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

function showQuestion(columnIndex, rowIndex) {
    questionTextNode.innerHTML = gameBoard.getQuestionText(columnIndex, rowIndex);
    questionTextNode.dataset.answer = gameBoard.getCorrectAnswer(columnIndex, rowIndex);
    questionStartTimestamp = new Date().getTime();
    questionTimerId = setInterval(questionTick, 100);

    render();
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

playerDataInQuestionBox.addEventListener("click", playerAnswerIndicated);

initialize();
