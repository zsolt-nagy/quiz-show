let board = document.querySelector(".js-board");

let categoryList = null;
let questionLists = null;

function renderQuestions(questionsList, columnIndex) {
    let html = "";
    for (let i = 0; i < questionsList.length; i++) {
        let question = questionsList[i];
        let score = 100 * (i + 1);
        html += `
            <div class="question cell">
                <div class="face-value" data-column="${columnIndex}" data-row="${i}">${score}</div>
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
