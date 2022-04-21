function updateSums() {
	let complete = true;
	let sums = [0, 0, 0, 0];
	const trs = document.querySelectorAll('#scorepad tbody tr');
	for (let y = 0; y < 20; y += 1) {
		if (y % 5 === 4) {
			// write current subtotals
			for (let x = 0; x < 4; x += 1) {
				if (complete) {
					trs[y].children[x + 1].textContent = sums[x];
				} else {
					trs[y].children[x + 1].textContent = '';
				}
			}
		} else {
			// increment subtotals
			for (let x = 0; x < 4; x += 1) {
				const cell = trs[y].children[x + 1].textContent;
				const score = Number(cell);
				sums[x] += score;
				complete &&= !Number.isNaN(score) && ((x & 1) === 1 || cell !== '');
			}
		}
	}
	// write totals
	const totals = document.querySelectorAll('#scorepad tfoot td:not(:first-child)');
	if (complete) {
		totals[0].textContent = sums[0] + sums[1];
		totals[1].textContent = sums[2] + sums[3];
	} else {
		totals[0].textContent = '';
		totals[1].textContent = '';
	}
}

function setScore(cell, score) {
	cell.textContent = score === null ? '' : score;
	cell.classList.remove('invalid');
}

function inputChanged(cell) {
	const x = Array.prototype.indexOf.call(cell.parentElement.children, cell);
	const score = Number(cell.textContent);
	const other = cell.parentElement.children[4 - x];
	if (Number.isNaN(score) || score < 0 || ((x & 1) === 1 && 162 < score)) {
		cell.classList.add('invalid');
		if (x & 1 === 1) {
			setScore(other, null);
		}
	} else {
		cell.classList.remove('invalid');
		if (x & 1 === 1) {
			otherScore = cell.textContent === '' ? null : 162 - score;
			setScore(other, otherScore);
		}
	}
	updateSums();
}

function setNames(wij, zij) {
	const ths = document.querySelectorAll('#scorepad thead tr:first-child th');
	ths[1].textContent = wij;
	ths[2].textContent = zij;
}

function setScores(scores) {
	const trs = document.querySelectorAll('#scorepad tbody tr:not(:nth-child(5n))');
	for (let y = 0; y < 16; y += 1) {
		for (let x = 0; x < 4; x += 1) {
			const cell = trs[y].children[x + 1];
			setScore(cell, scores[4 * y + x]);
		}
	}
	updateSums();
}

// base64 to base64url
function toB64u(base64) {
	return base64.replace(/\+|\/|=/g, match => {
		if (match === '+') { 
			return '-';
		} else if (match === '/') {
			return '_';
		} else {
			return '';
		}
	});
}

// base64url to base64
function fromB64u(base64url) {
	return base64url.replace(/-|_/g, match => {
		if (match === '-') { 
			return '+';
		} else {
			return '/';
		}
	});
}

function getStorageObject() {
	const ths = document.querySelectorAll('#scorepad thead tr:first-child th');
	let scores = [];
	for (const tr of document.querySelectorAll('#scorepad tbody tr:not(:nth-child(5n))')) {
		for (const cell of tr.querySelectorAll('td:not(:first-child)')) {
			const score = Number(cell.textContent);
			if (cell.textContent === '' || Number.isNaN(score)) {
				scores.push(null);
			} else {
				scores.push(score);
			}
		}
	}
	array = scores.map(s => s === null ? 0xffff : s);
	byteArray = new Uint8Array(Uint16Array.from(array).buffer);
	base64 = btoa(String.fromCharCode(...byteArray));
	base64url = toB64u(base64);
	return {
		wij: ths[1].textContent,
		zij: ths[2].textContent,
		scoreString: base64url,
	}
}

function decodeScores(base64url) {
	if (base64url === null) {
		return new Array(64).fill(null);
	}
	const base64 = fromB64u(base64url);
	const ascii = atob(base64);
	const byteArray = Uint8Array.from(ascii, c => c.charCodeAt(0));
	const array = Array.from(new Uint16Array(byteArray.buffer));
	const scores = array.map(s => s === 0xffff ? null : s);
	return scores;
}

function baseStorageName() {
	return 'klaverjassen';
}

function getParameter(key, fallback) {
	const params = new URLSearchParams(window.location.search);
	return params.get(key) || localStorage.getItem(`${baseStorageName()}[${key}]`) || fallback;
}

function setShareUrl(wij, zij, scoreString) {
	const baseUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
	const url = `${baseUrl}?wij=${encodeURIComponent(wij)}&zij=${encodeURIComponent(zij)}&scores=${encodeURIComponent(scoreString)}`;
	document.getElementById('shareUrl').value = url;
}

function saveStorage() {
	const { wij, zij, scoreString } = getStorageObject();
	localStorage.setItem(`${baseStorageName()}[wij]`, wij);
	localStorage.setItem(`${baseStorageName()}[zij]`, zij);
	localStorage.setItem(`${baseStorageName()}[scores]`, scoreString);
	setShareUrl(wij, zij, scoreString);
}

function share() {
	const shareObj = {
		title: 'Score klaverjassen',
		url: document.getElementById('shareUrl').value
	};
	if (navigator.share) {
		navigator.share(shareObj);
	}
}

function initialize() {
	const wij = getParameter('wij', 'Wij');
	const zij = getParameter('zij', 'Zij');
	const scoreString = getParameter('scores', '');
	setNames(wij, zij);
	setScores(decodeScores(scoreString));
	setShareUrl(wij, zij, scoreString);
}

window.addEventListener('DOMContentLoaded', function() {
	// handle input
	document.querySelector('#scorepad tbody').addEventListener('input', e => inputChanged(e.target));

	// (de)select cell
	document.querySelector('#scorepad').addEventListener('focusin', e => {
		if (e.target.tagName !== 'BUTTON') {
			window.getSelection().selectAllChildren(e.target);
		}
	});
	document.querySelector('#scorepad tbody').addEventListener('focusout', e => {
		window.getSelection().removeAllRanges();
		saveStorage();
	});
	
	// toggle menu
	document.getElementById('showMenu').addEventListener('click', _ => {
		document.getElementById('menu').showModal();
	});
	document.getElementById('menu').addEventListener('click', e => {
		if (e.target.id !== 'menu') {
			return;
		}
		const r = e.target.getBoundingClientRect();
		if (e.clientY < r.top || r.bottom < e.clientY || e.clientX < r.left || r.right < e.clientX) {
			e.target.close();
		}
	});

	// menu
	document.getElementById('shareUrl').addEventListener('focus', e => {
		e.target.select();
	});
	document.getElementById('share').addEventListener('click', _ => share());
	document.getElementById('new').addEventListener('click', _ => {
		if (window.confirm('Scores verwijderen?')) {
			setScores(new Array(64).fill(null));
		}
	});

	// initialize table
	initialize();
});

