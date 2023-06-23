const QUESTION_STATES = {
    DONE: "DONE",
    ACTIVE: "ACTIVE",
    // undefined: not yet selected
};

/* 
    This was a good first exercise to extract properties and operations belonging to the
    same Board class.

    However, there are some problems: 
    1. The granularity of board is too high. Inside Board, there could be Category items, 
       and inside Categories, there could be questions.
    2. Board as a class encapsulates most aspects of Board data and functionality, making
       the implementation convoluted. Separation e.g. in terms of Model-View-Controller
       could be desirable. (note: for model, we'd need to include fetching the questions too)
    3. We excluded the showQuestion --> endQuestion logic from the board, even though it's
       debatable if the question screen is part of the board or it's a separate object.
    4. Too much coupling between markup (especially data- attributes) and the Board class.
*/
class Board {
    #questionLists;
    #boardContainerNode;
    #blockNewQuestions;
    constructor(questionLists, node, showQuestion) {
        this.#questionLists = questionLists;
        this.#boardContainerNode = node;
        // TODO: memory leak busting in case you create multiple tables (clear the click listener)
        this.#boardContainerNode.addEventListener("click", this.boardClicked);
        this.#blockNewQuestions = false;
        this.showQuestion = showQuestion;
    }

    unblockBoard() {
        this.#blockNewQuestions = false;
    }

    // Event handling - gameplay
    getTargetNodeFromEvent(event) {
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

    selectQuestion(targetNode) {
        let rowIndex = targetNode.dataset.row;
        let columnIndex = targetNode.dataset.column;
        currentQuestionValue = Number.parseInt(targetNode.innerText);

        this.updateQuestionState(columnIndex, rowIndex, QUESTION_STATES.ACTIVE);
        this.renderBoard();

        this.#blockNewQuestions = true;

        setTimeout(() => {
            targetNode.innerHTML = "";
            this.updateQuestionState(columnIndex, rowIndex, QUESTION_STATES.DONE);
            this.showQuestion(columnIndex, rowIndex);
        }, 1000);
    }

    boardClicked = (event) => {
        // remember context binding: without =>, this is the element clicked on
        if (this.#blockNewQuestions) return;

        let targetNode = this.getTargetNodeFromEvent(event);

        if (targetNode !== null) {
            this.selectQuestion(targetNode);
        }
    };

    updateQuestionState(columnIndex, rowIndex, newState) {
        this.#questionLists[columnIndex][rowIndex].state = newState;
    }

    getCorrectAnswer(columnIndex, rowIndex) {
        return this.#questionLists[columnIndex][rowIndex].correct_answer;
    }

    getQuestionText(columnIndex, rowIndex) {
        return this.#questionLists[columnIndex][rowIndex].question;
    }

    getColumnMarkup(questionsList, columnIndex) {
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

    getBoardMarkup() {
        let html = "";
        for (let i = 0; i < this.#questionLists.length; i++) {
            let list = this.#questionLists[i];
            html += `
                <section class="topic-container">
                    <div class="topic-name cell">${list[0].category}</div>
                    ${this.getColumnMarkup(list, i)}
                </section>`;
        }

        return html;
    }

    renderBoard() {
        this.#boardContainerNode.innerHTML = this.getBoardMarkup();
    }
}
