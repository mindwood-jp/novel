document.addEventListener('DOMContentLoaded', () => {
	// ローカル表示の判定
	const hostname = window.location.hostname;
	const protocol = window.location.protocol;
	const isDevelopment =
		protocol === 'file:' ||
		hostname === 'localhost' ||
		hostname === '127.0.0.1';
	if (isDevelopment) {
		document.body.style.backgroundColor = '#e8f4fb';
		document.body.classList.add('local-mode');
	}

	// 目次の生成
	const nav = document.getElementById('novel-nav');
	const headers = document.querySelectorAll('h2');
	headers.forEach((h2, index) => {
		if (h2.textContent.trim() === 'プロローグ') return;
		const id = 'chapter-' + index;
		h2.id = id;
		const link = document.createElement('a');
		link.href = '#' + id;
		link.textContent = h2.textContent;
		nav.appendChild(link);
	});
	
	// トップへ戻るボタンを生成
	const toTop = document.createElement('a');
	toTop.id = 'to-top';
	toTop.href = '#';
	toTop.title = '先頭へ戻る';
	toTop.setAttribute('aria-label', '先頭へ戻る');
	toTop.innerHTML = '<svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5 L5 13 H9 V20 H15 V13 H19 Z"/></svg>';
	document.body.appendChild(toTop);

	const headerImg = document.querySelector('header img');
	const updateToTop = () => {
		const threshold = headerImg ? headerImg.getBoundingClientRect().bottom + window.scrollY : 0;
		if (window.scrollY > threshold) {
			toTop.style.display = 'flex';
		} else {
			toTop.style.display = 'none';
		}
	};
	updateToTop();
	window.addEventListener('scroll', updateToTop);

	// 現在の章を右上に表示
	const chapterIndicator = document.createElement('div');
	chapterIndicator.id = 'chapter-indicator';
	document.body.appendChild(chapterIndicator);
	const updateChapter = () => {
		let current = null;
		headers.forEach((h2) => {
			if (h2.getBoundingClientRect().top <= 40) {
				current = h2;
			}
		});
		if (current) {
			const title = current.nextElementSibling ? current.nextElementSibling.textContent.trim() : '';
			const chapter = current.textContent.trim();
			chapterIndicator.textContent = title && title !== '\u00a0' ? chapter + '\u3000' + title : chapter;
			chapterIndicator.style.display = 'block';
		} else {
			chapterIndicator.style.display = 'none';
		}
	};
	updateChapter();
	window.addEventListener('scroll', updateChapter);

	// 拡大・縮小ズーム（PC閲覧時のみ）
	const zoomTargets = [document.querySelector('header'), document.querySelector('main')].filter(Boolean);
	const ZOOM_MIN = 0.7;
	const ZOOM_MAX = 1.8;
	const ZOOM_STEP = 0.1;
	const ZOOM_KEY = 'novelZoom';
	let zoom = parseFloat(localStorage.getItem(ZOOM_KEY)) || 1;
	const zoomControl = document.createElement('div');
	zoomControl.id = 'zoom-control';
	const zoomIn = document.createElement('button');
	zoomIn.type = 'button';
	zoomIn.textContent = '+';
	zoomIn.setAttribute('aria-label', '拡大');
	const zoomLevel = document.createElement('div');
	zoomLevel.id = 'zoom-level';
	zoomLevel.title = 'クリックで等倍に戻す';
	const zoomOut = document.createElement('button');
	zoomOut.type = 'button';
	zoomOut.textContent = '−';
	zoomOut.setAttribute('aria-label', '縮小');
	zoomControl.appendChild(zoomIn);
	zoomControl.appendChild(zoomLevel);
	zoomControl.appendChild(zoomOut);
	document.body.appendChild(zoomControl);
	const applyZoom = () => {
		zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(zoom * 100) / 100));
		zoomTargets.forEach((el) => { el.style.zoom = zoom; });
		zoomLevel.textContent = Math.round(zoom * 100) + '%';
		localStorage.setItem(ZOOM_KEY, zoom);
	};
	zoomIn.addEventListener('click', () => { zoom += ZOOM_STEP; applyZoom(); });
	zoomOut.addEventListener('click', () => { zoom -= ZOOM_STEP; applyZoom(); });
	zoomLevel.addEventListener('click', () => { zoom = 1; applyZoom(); });
	applyZoom();

	// 音声読み上げ
	const synth = window.speechSynthesis;
	if (!synth) return;

	// 面塗りSVGアイコン（currentColorで色を継承）
	const ICON_PLAY = '<svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4 L19 12 L7 20 Z"/></svg>';
	const ICON_PAUSE = '<svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
	const ICON_STOP = '<svg width="25" height="25" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="1.5"/></svg>';

	const ttsControl = document.createElement('div');
	ttsControl.id = 'tts-control';
	const btnPlay = document.createElement('button');
	btnPlay.type = 'button';
	btnPlay.innerHTML = ICON_PLAY;
	btnPlay.setAttribute('aria-label', '再生');
	const btnStop = document.createElement('button');
	btnStop.type = 'button';
	btnStop.innerHTML = ICON_STOP;
	btnStop.setAttribute('aria-label', '停止');
	ttsControl.appendChild(btnPlay);
	ttsControl.appendChild(btnStop);
	document.body.appendChild(ttsControl);

	let ttsParagraphs = [];
	let ttsIndex = 0; // 現在再生中の段落
	let ttsPlaying = false;
	let ttsToken = 0; // 再生セッションを識別。cancel時にインクリメント

	const getTtsParagraphs = () => {
		let current = null;
		headers.forEach((h2) => {
			if (h2.getBoundingClientRect().top <= window.innerHeight) {
				current = h2;
			}
		});
		if (!current) current = headers[0];
		if (!current) return [];
		const result = [];
		let el = current.nextElementSibling;
		while (el && el.tagName !== 'H2') {
			if (el.tagName === 'SECTION' || el.tagName === 'DIV') {
				el.querySelectorAll('p').forEach(p => result.push(p));
			} else if (el.tagName === 'P') {
				result.push(el);
			}
			el = el.nextElementSibling;
		}
		if (result.length === 0) {
			const section = current.closest('section');
			if (section) {
				section.querySelectorAll('p').forEach(p => result.push(p));
			}
		}
		return result;
	};

	const clearHighlight = () => {
		document.querySelectorAll('.tts-highlight').forEach(el => el.classList.remove('tts-highlight'));
	};

	// 段落要素から読み上げ用テキストを生成（ルビは読みだけを使う）
	const getReadingText = (element) => {
		const clone = element.cloneNode(true);
		clone.querySelectorAll('ruby').forEach((ruby) => {
			const rt = ruby.querySelector('rt');
			const yomi = rt ? rt.textContent : ruby.textContent;
			ruby.replaceWith(document.createTextNode(yomi));
		});
		return clone.textContent.trim();
	};

	const stopSpeaking = () => {
		ttsToken++; // 進行中のonendを無効化
		ttsPlaying = false;
		synth.cancel();
	};

	const updateButtons = () => {
		btnPlay.innerHTML = ttsPlaying ? ICON_PAUSE : ICON_PLAY;
		btnPlay.setAttribute('aria-label', ttsPlaying ? '一時停止' : '再生');
		btnStop.disabled = !ttsPlaying && ttsIndex === 0;
	};

	const speakNext = () => {
		if (ttsIndex >= ttsParagraphs.length) { // 章末まで読み終わった
			clearHighlight();
			ttsPlaying = false;
			ttsIndex = 0;
			updateButtons();
			return;
		}
		const p = ttsParagraphs[ttsIndex];
		const text = p.textContent.trim();
		clearHighlight();
		if (text) p.classList.add('tts-highlight');
		p.scrollIntoView({ behavior: 'smooth', block: 'center' }); // 空段落（◆だけなど）はスキップ
		if (!text) {
			ttsIndex++;
			speakNext();
			return;
		}
		const readingText = getReadingText(p);
		const myToken = ttsToken;
		const utter = new SpeechSynthesisUtterance(readingText);
		utter.lang = 'ja-JP';
		utter.rate = 1.0;
		utter.onend = () => {
			if (!ttsPlaying || myToken !== ttsToken) return;
			ttsIndex++;
			speakNext();
		};
		utter.onerror = () => {
			if (!ttsPlaying || myToken !== ttsToken) return;
			ttsIndex++;
			speakNext();
		};
		// 場面転換（nrクラス）の段落は、少し間を置いてから読み始める
		const NR_PAUSE_MS = 2500;
		if (p.classList.contains('nr')) {
			setTimeout(() => {
				if (!ttsPlaying || myToken !== ttsToken) return; // 待機中に停止されたら読まない
				synth.speak(utter);
			}, NR_PAUSE_MS);
		} else {
			synth.speak(utter);
		}
	};

	const startSpeaking = () => {
		ttsParagraphs = getTtsParagraphs();
		if (ttsParagraphs.length === 0) return;
		if (ttsIndex >= ttsParagraphs.length) ttsIndex = 0;
		ttsPlaying = true;
		updateButtons();
		speakNext();
	};

	btnPlay.addEventListener('click', () => {
		if (ttsPlaying) {
			stopSpeaking(); // 一時停止（再開時に同じ段落から）
			clearHighlight();
			updateButtons();
		} else {
			stopSpeaking(); // 念のため
			startSpeaking();
		}
	});

	btnStop.addEventListener('click', () => {
		stopSpeaking();
		ttsIndex = 0;
		clearHighlight();
		updateButtons();
	});

	window.addEventListener('beforeunload', () => { synth.cancel(); });
	updateButtons();
});
