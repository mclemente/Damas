/*----------- Game State Data ----------*/

class Gameboard {
	constructor(TABLE_SIZE) {
		this.TABLE_SIZE = TABLE_SIZE;
	}
	pieces = [];

	add(piece) {
		piece.parent = this;
		this.pieces.push(piece);
	}

	remove(piece) {
		this.pieces = this.pieces.filter((p) => p.id !== piece.id);
	}

	get children() {
		return this.pieces;
	}

	getPiece(x, y) {
		return this.pieces.find((piece) => piece.position.x === x && piece.position.y === y) ?? null;
	}

	select(position, negativeY = false) {
		const x = convertLetterToNumber(position[0]) - 1;
		const y = negativeY ? position[1] : 8 - position[1];
		return this.getPiece(x, y);
	}
}

class TabletopGame {
	constructor() {
		this.board = new Gameboard(this.TABLE_SIZE);
		this.board.parent = this;
		this.players = {
			[WHITE]: { timer: new Timer("relogio-vermelho"), points: 0 },
			[BLACK]: { timer: new Timer("relogio-preto"), points: 0 },
		};
		// GAMEBOARD = new Array(this.TABLE_SIZE);
		// for (let i = 0; i < this.TABLE_SIZE; i++) {
		// 	GAMEBOARD[i] = new Array(this.TABLE_SIZE);
		// }
	}
	turn = WHITE;
	ep_square = EMPTY;
	half_moves = 0;
	move_number = 1;
	selected = null;
	// history = [];

	DEFAULT_POSITION = "8/8/8/8/8/8/8/8 w ---- - 0 1";
	PIECE_TYPES = {};
	TABLE_SIZE = 8;

	get pieces() {
		return this.board.pieces;
	}

	// get(square) {
	// 	const piece = board[GAMEBOARD[square]];
	// 	return piece ? { type: piece.type, color: piece.color } : null;
	// }

	load(fen) {
		const tokens = fen.split(/\s+/);
		const position = tokens[0];
		let square = 0;

		if (!this.validate_fen(fen).valid) {
			return false;
		}

		for (let i = 0; i < position.length; i++) {
			const piece = position.charAt(i);

			if (piece === "/") {
				square += this.TABLE_SIZE;
			} else if (this.is_digit(piece)) {
				square += parseInt(piece, 10);
			} else {
				const color = piece < "a" ? BLACK : WHITE;
				this.put({ type: piece.toLowerCase(), color: color }, this.algebraic(square));
				square++;
			}
		}

		this.turn = tokens[1];

		this.ep_square = tokens[3] === "-" ? EMPTY : SQUARE_MAP[tokens[3]];
		this.half_moves = parseInt(tokens[4], 10);
		this.move_number = parseInt(tokens[5], 10);

		// update_setup(generate_fen());

		table.innerHTML = this.setup_html();
		pieces = document.querySelectorAll("p");
		cells = document.querySelectorAll("td");
		// initialize event listeners on pieces
		for (let i = 0; i < pieces.length; i++) {
			pieces[i].addEventListener("click", (event) => getPlayerPieces(event));
		}
		for (let i = 0; i < cells.length; i++) {
			cells[i].addEventListener("click", (event) => movePieces(event));
		}

		return true;
	}

	validate_fen(fen) {
		return { valid: false };
	}

	setup_html() {
		const pieces = Object.assign({}, this.pieces);
		let s = "<table>";
		for (let i = 0; i < this.TABLE_SIZE; i++) {
			s += "\n<tr>";
			for (let j = 0; j < this.TABLE_SIZE; j++) {
				let piece = Object.values(pieces).find((piece) => piece.position.x == j && piece.position.y == i);
				if (piece) {
					const key = Object.keys(pieces).find((key) => pieces[key].id === piece.id);
					delete pieces[key];
					s += `\n<td data-x="${i}" data-y="${j}"><p class="${piece.color}-piece" data-x="${i}" data-y="${j}" data-id="${piece.id}" data-color="${piece.color}"></p></td>`;
				} else s += `\n<td data-x="${i}" data-y="${j}"></td>`;
			}
		}
		return s;
	}

	atualizaHtml() {
		table.innerHTML = this.setup_html();
		pieces = document.querySelectorAll("p");
		cells = document.querySelectorAll("td");
		// initialize event listeners on pieces
		for (let i = 0; i < pieces.length; i++) {
			pieces[i].addEventListener("click", (event) => getPlayerPieces(event));
		}
		for (let i = 0; i < cells.length; i++) {
			cells[i].addEventListener("click", (event) => movePieces(event));
		}
	}

	move(piecePosition, newPosition) {
		const piece = this.board.select(piecePosition);
		if (!piece) console.error("Pe??a n??o existe");
		else if (piece.color === this.turn) {
			newPosition = {
				x: convertLetterToNumber(newPosition[0]) - 1,
				y: 8 - newPosition[1],
			};
			piece.move(newPosition);
		} else {
			console.warn("Movimento inv??lido: n??o ?? o seu turno.");
			console.log(game.ascii());
		}
	}

	put() {}

	capture(piece) {
		this.board.remove(piece);
	}

	reset() {
		this.load(this.DEFAULT_POSITION);
	}

	select(position) {
		const piece = this.board.select(position);
		if (piece) piece.onSelect();
		this.selected = this.board.select(position);
	}

	// update_setup(fen) {
	// 	if (this.history.length > 0) return;

	// 	if (fen !== this.DEFAULT_POSITION) {
	// 		header["SetUp"] = "1";
	// 		header["FEN"] = fen;
	// 	} else {
	// 		delete header["SetUp"];
	// 		delete header["FEN"];
	// 	}
	// }

	endTurn() {
		this.timer.pause();
		this.turn = [WHITE, BLACK][+(this.turn === WHITE)];
		this.timer.start();
		this.atualizaHtml();
		const colors = ["lightGrey", "black"];
		for (let i = 0; i < 2; i++) {
			redTurnText[i].style.color = colors[+(this.turn === WHITE)];
			blackTurntext[i].style.color = colors[+(this.turn !== WHITE)];
		}
		relogioVermelho.style.color = colors[+(this.turn === WHITE)];
		relogioPreto.style.color = colors[+(this.turn !== WHITE)];
	}

	get timer() {
		return this.players[this.turn].timer;
	}

	ascii() {
		let s = "   +------------------------+\n";
		for (let i = 0; i < this.TABLE_SIZE; i++) {
			/* display the rank */
			s += " " + "87654321"[i] + " |";
			for (let j = 0; j < this.TABLE_SIZE; j++) {
				const piece = game.board.getPiece(j, i);
				if (piece == null) {
					s += " . ";
				} else {
					// const symbol = piece.color === WHITE ? piece.type.toUpperCase() : piece.type.toLowerCase();
					const symbol = piece.color === WHITE ? "B" : "P";
					s += " " + symbol + " ";
				}
			}
			s += "|\n";
		}
		s += "   +------------------------+\n";
		s += "     a  b  c  d  e  f  g  h";

		return s;
	}

	/*****************************************************************************
	 * UTILITY FUNCTIONS
	 ****************************************************************************/

	algebraic(i) {
		const f = this.file(i),
			r = this.rank(i);
		return ["abcdefgh".substring(f, f + 1), "87654321".substring(r, r + 1)];
	}

	file(i) {
		return i & 15;
	}

	is_digit(c) {
		return "0123456789".indexOf(c) !== -1;
	}

	rank(i) {
		return i >> 4;
	}
}

class Checkers extends TabletopGame {
	SYMBOLS = "pqPQ";
	DEFAULT_POSITION = "p1p1p1p1/1p1p1p1p/p1p1p1p1/8/8/1P1P1P1P/P1P1P1P1/1P1P1P1P w ---- - 0 1";

	PIECE_TYPES = {
		PAWN: "p",
		QUEEN: "q",
	};

	put(piece, square) {
		/* check for valid piece object */
		if (!("type" in piece && "color" in piece)) {
			return false;
		}

		/* check for piece */
		if (this.SYMBOLS.indexOf(piece.type.toLowerCase()) === -1) {
			return false;
		}

		const x = convertLetterToNumber(square[0]) - 1;
		const y = square[1] - 1;
		// if (!(GAMEBOARD.length > y && GAMEBOARD[y].length > x)) {
		// /* check for valid square */
		// return false;
		// }
		// GAMEBOARD[y][x] = { type: piece.type, color: piece.color };
		this.board.add(new CheckersPiece(piece.type, piece.color, { x, y }));
		// GAMEBOARD[y][x] = new CheckersPiece(piece.type, piece.color, { x, y });

		// update_setup(generate_fen());

		return true;
	}

	validate_fen(fen) {
		const errors = {
			0: "No errors.",
			1: "FEN string must contain six space-delimited fields.",
			2: "6th field (move number) must be a positive integer.",
			6: "2nd field (side to move) is invalid.",
			7: "1st field (piece positions) does not contain 8 '/'-delimited rows.",
			8: "1st field (piece positions) is invalid [consecutive numbers].",
			9: "1st field (piece positions) is invalid [invalid piece].",
			10: "1st field (piece positions) is invalid [row too large].",
		};

		/* 1st criterion: 6 space-seperated fields? */
		const tokens = fen.split(/\s+/);
		if (tokens.length !== 6) {
			return { valid: false, error_number: 1, error: errors[1] };
		}

		/* 2nd criterion: move number field is an integer value > 0? */
		if (isNaN(parseInt(tokens[5])) || parseInt(tokens[5], 10) <= 0) {
			return { valid: false, error_number: 2, error: errors[2] };
		}

		/* 6th criterion: 2nd field is "w" (white) or "b" (black)? */
		if (!/^([wb])$/.test(tokens[1])) {
			return { valid: false, error_number: 6, error: errors[6] };
		}

		/* 7th criterion: 1st field contains 8 rows? */
		const rows = tokens[0].split("/");
		if (rows.length !== this.TABLE_SIZE) {
			return { valid: false, error_number: 7, error: errors[7] };
		}

		/* 8th criterion: every row is valid? */
		let regStr = Object.values(this.PIECE_TYPES).join("");
		regStr += regStr.toUpperCase();
		const PIECES_REGEX = new RegExp(`^[${regStr}]$`);
		for (let i = 0; i < rows.length; i++) {
			/* check for right sum of fields AND not two numbers in succession */
			let sum_fields = 0;
			let previous_was_number = false;

			for (let k = 0; k < rows[i].length; k++) {
				if (!isNaN(rows[i][k])) {
					if (previous_was_number) {
						return { valid: false, error_number: 8, error: errors[8] };
					}
					sum_fields += parseInt(rows[i][k], 10);
					previous_was_number = true;
				} else {
					if (!PIECES_REGEX.test(rows[i][k])) {
						return { valid: false, error_number: 9, error: errors[9] };
					}
					sum_fields += 1;
					previous_was_number = false;
				}
			}
			if (sum_fields !== this.TABLE_SIZE) {
				return { valid: false, error_number: 10, error: errors[10] };
			}
		}

		/* everything's okay! */
		return { valid: true, error_number: 0, error: errors[0] };
	}
}

class Piece {
	constructor(type, color, position) {
		this.id = Piece.id;
		Piece.id++;
		this.type = type;
		this.color = color;
		this.position = position;
	}
	static id = 0;
	movements = [];
	captures = [];
	validCaptures = [];
	validMovements = [];

	getPosition() {
		return `${(this.position.x + 10).toString(36)}${"87654321"[this.position.y]}`;
	}

	move(position, endTurn = true) {
		this.validCaptures = [];
		this.validMovements = [];
		this.checkValidMovements();
		this.checkValidCaptures();
		if (this.validMovements.some((mov) => mov.x == position.x && mov.y == position.y)) {
			console.log(
				`A pe??a se moveu de ${(this.position.x + 10).toString(36)}${this.position.y - 2} to ${(
					position.x + 10
				).toString(36)}${position.y}.`
			);
			// delete GAMEBOARD[this.position.y][this.position.x];
			this.position = { x: position.x, y: position.y };
			// GAMEBOARD[this.position.y][this.position.x] = this;
			if (endTurn) game.endTurn();
			console.log(game.ascii());
		} else if (this.validCaptures.some((cap) => cap.x == position.x && cap.y == position.y)) {
			console.log(
				`A pe??a se moveu de ${(this.position.x + 10).toString(36)}${this.position.y - 2} to ${(
					position.x + 10
				).toString(36)}${position.y} e capturou uma pe??a.`
			);
			// delete GAMEBOARD[this.position.y][this.position.x];
			this.position = { x: position.x, y: position.y };
			// GAMEBOARD[this.position.y][this.position.x] = this;
			const capturada = this.validCaptures.find((cap) => cap.x == position.x && cap.y == position.y).captura;
			game.capture(capturada);
			if (endTurn) game.endTurn();
			console.log(game.ascii());
		} else console.log("Movimento inv??lido.");
	}

	get indexOfBoardPiece() {
		return this.position.y * 8 + this.position.x;
	}

	get negativeY() {
		return this.color === BLACK;
	}

	get x() {
		return this.position.x;
	}

	get y() {
		return this.position.y;
	}
}

class CheckersPiece extends Piece {
	movements = [
		{ x: 1, y: 1 },
		{ x: -1, y: 1 },
	];
	captures = this.movements;
	onSelect() {
		this.validMovements = [];
		this.validCaptures = [];
		this.checkValidMovements();
		const movimentos = [];
		const capturas = [];
		for (let mov of this.validMovements) {
			movimentos.push(`${(mov.x + 10).toString(36)}${mov.y}`);
		}
		if (movimentos.length) console.log(`Movimentos v??lidos: ${movimentos.sort().join(", ")}`);

		this.checkValidCaptures();
		for (let mov of this.validCaptures) {
			capturas.push(`${(mov.x + 10).toString(36)}${mov.y}`);
		}
		if (capturas.length) console.log(`Capturas v??lidas: ${capturas.sort().join(", ")}`);
	}
	checkValidMovements() {
		// TODO checar movimentos com NUM (X) negativo para as pe??as vermelhas
		for (let mov of this.movements) {
			const diffX = this.position.x + mov.x;
			// const diffY = 8 - this.position.y + (this.negativeY ? -mov.y : mov.y);
			const diffY = (this.negativeY ? this.position.y : 8 - this.position.y) + mov.y;
			if (diffX < 0 || diffY < 0) continue;
			const position = this.parent.select(`${(diffX + 10).toString(36)}${diffY}`, this.negativeY);
			if (!position) {
				this.validMovements.push({ x: diffX, y: diffY });
			}
		}
	}
	checkValidCaptures() {
		for (let cap of this.captures) {
			const capX = cap.x;
			const capY = cap.y;
			const diffY = this.negativeY ? this.position.y : 8 - this.position.y;
			const attackPosition = `${(this.position.x + capX + 10).toString(36)}${diffY + capY}`;
			const landingPosition = `${(this.position.x + 2 * capX + 10).toString(36)}${diffY + 2 * capY}`;
			const position = this.parent.select(attackPosition, this.negativeY);
			if (position && position.color !== this.color && !this.parent.select(landingPosition)) {
				this.validCaptures.push({
					x: this.position.x + 2 * capX,
					y: diffY + (this.negativeY ? 2 : -2) * capY,
					captura: position,
				});
			}
		}
	}
}

// Rel??gio

class Timer {
	constructor(target) {
		this.target = document.querySelector(`#${target}`);
		this.totalSeconds = TEMPO_MAX;
	}
	display(tempo) {
		var segundos = Math.floor(tempo % 60);
		var minutos = Math.floor((tempo / 60) % 60);
		this.target.innerHTML = [minutos, segundos].map(this.pad).join(":");
	}
	start() {
		var self = this;
		if (this.totalSeconds) {
			this.interval = setInterval(function () {
				self.display(self.totalSeconds);
				self.totalSeconds -= 1;
				if (self.counter < 0) {
					clearInterval(this.interval);
				}
			}, 1000);
		}
	}
	pad(tempo) {
		return tempo < 10 ? "0" + tempo : tempo;
	}
	pause() {
		clearInterval(this.interval);
		delete this.interval;
	}
	resume() {
		if (!this.interval) this.start();
	}
}

/***************************************************************************
 * PUBLIC CONSTANTS
 **************************************************************************/

const TEMPO_MAX = 180;
const BLACK = "b";
const WHITE = "w";

const EMPTY = -1;

// DOM
const table = document.querySelector("table");
let pieces = document.querySelectorAll("p");
let cells = document.querySelectorAll("td");
const redTurnText = document.querySelectorAll(".red-turn-text");
const relogioVermelho = document.getElementById("relogio-vermelho");
const blackTurntext = document.querySelectorAll(".black-turn-text");
const relogioPreto = document.getElementById("relogio-preto");
const divider = document.querySelector("#divider");

/*---------- Helpers ----------*/
function convertLetterToNumber(str) {
	if ((typeof str === "string" || str instanceof String) && /^[a-zA-Z]+$/.test(str)) {
		str = str.toUpperCase();
		let out = 0,
			len = str.length;
		for (let pos = 0; pos < len; pos++) {
			out += (str.charCodeAt(pos) - 64) * Math.pow(26, len - pos - 1);
		}
		return out;
	}
	return undefined;
}

function getPlayerPieces(event) {
	const position = "abcdefgh"[event.target.dataset.y] + "87654321"[event.target.dataset.x];
	game.select(position);
}

function movePieces(event) {
	const position = "abcdefgh"[event.target.dataset.y] + "87654321"[event.target.dataset.x];
	if (!event.target.dataset.id && game.selected) {
		game.move(game.selected.getPosition(), position);
	}
}

// givePiecesEventListeners();

let game = new Checkers();
game.reset();
console.log(game.ascii());
var button = document.querySelector("#botao");
button.addEventListener("click", function () {
	game.players[WHITE].timer.start();
	button.remove();
});

// Testes
// game.move("a3", "b4");
// game.move("d6", "c5");
// game.move("b4", "d6");
// game.move("b6", "c5");
