let board = document.querySelector(".js-board");

let categoryList = null;
let questionLists = null;

let blockNewQuestions = false;

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

function initialize() {
    // get categories
    fetch("https://opentdb.com/api_category.php")
        .then((x) => x.json())
        .then(categoriesLoaded);
}

function testInitialize() {
    questionLists = testQuestions;
    renderBoard();
}

function boardClicked(event) {
    if (blockNewQuestions) return;

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

    if (targetNode !== null) {
        let rowIndex = targetNode.dataset.row;
        let columnIndex = targetNode.dataset.column;

        targetNode.classList.remove("js-face-value");
        targetNode.classList.remove("face-value");
        targetNode.classList.add("js-question-done");
        targetNode.innerHTML = "?";

        blockNewQuestions = true;

        setTimeout(() => {
            targetNode.innerHTML = "";
            console.log(questionLists[columnIndex][rowIndex]);
            blockNewQuestions = false;
        }, 1000);
    }
}

board.addEventListener("click", boardClicked);
