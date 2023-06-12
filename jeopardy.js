let board = document.querySelector(".js-board");
let questionDisplayNode = document.querySelector(".js-question-display");
let questionTextNode = document.querySelector(".js-question-text");
let questionTimeLeftNode = document.querySelector(".js-question-time");
let scoreContainer = document.querySelector(".js-score");
let playerDataInQuestionBox = document.querySelector(".js-player-data-in-question");

let categoryList = null;
let questionLists = null;

let blockNewQuestions = false;
let questionStartTimestamp = null;
let questionTimerId = null;

let players = [
    {
        name: "Player 1",
        score: 0,
    },
    {
        name: "Player 2",
        score: 0,
    },
    {
        name: "Player 3",
        score: 0,
    },
];

// Initialization
function initialize() {
    renderPlayers(scoreContainer);
    // get categories
    fetch("https://opentdb.com/api_category.php")
        .then((x) => x.json())
        .then(categoriesLoaded);
}

function testInitialize() {
    renderPlayers(scoreContainer);
    questionLists = testQuestions;
    renderBoard();
}

// players
function renderPlayers(container) {
    container.innerHTML = players
        .map(
            (player) => `
        <div class="player-container">
            <div class="player-name">${player.name}</div>
            <div class="player-score">${player.score}</div>
        </div> 
    `
        )
        .join("\n");
}

// Rendering and retrieval of questions
function renderQuestions(questionsList, columnIndex) {
    let html = "";
    for (let i = 0; i < questionsList.length; i++) {
        let question = questionsList[i];
        let score = 100 * (i + 1);
        html += `
            <div class="js-question question cell">
                <div class="js-face-value face-value" data-column="${columnIndex}" data-row="${i}">${score}</div>
                <div class="question-text invisible">${question.question}</div>
            </div>
        `;
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
    renderBoard();
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

function questionTick() {
    let currentTimestamp = new Date().getTime();
    let timeElapsed = currentTimestamp - questionStartTimestamp;
    let numberOfDots = Math.max(0, Math.round(((10000 - timeElapsed) / 10000) * 20));
    let dots = new Array(numberOfDots).fill("•").join("");
    questionTimeLeftNode.innerHTML = dots;

    if (numberOfDots === 0) {
        clearInterval(questionTimerId);
        questionDisplayNode.classList.add("invisible");
        // TODO clean up
        blockNewQuestions = false;
    }
}

function showQuestion(question) {
    questionTextNode.innerHTML = question.question;
    renderPlayers(playerDataInQuestionBox);
    questionDisplayNode.classList.remove("invisible");
    questionStartTimestamp = new Date().getTime();
    questionTimerId = setInterval(questionTick, 100);
}

function selectQuestion(targetNode) {
    let rowIndex = targetNode.dataset.row;
    let columnIndex = targetNode.dataset.column;

    targetNode.classList.remove("js-face-value");
    targetNode.classList.remove("face-value");
    targetNode.classList.add("js-question-done");
    targetNode.innerHTML = "?";

    blockNewQuestions = true;

    setTimeout(() => {
        targetNode.innerHTML = "";
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

board.addEventListener("click", boardClicked);
