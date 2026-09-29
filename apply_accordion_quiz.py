from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

css = r'''

/* Quiz question accordion */
.quiz-intro{margin-bottom:18px}.quiz-intro .h1{margin-bottom:8px}.quiz-accordion{display:grid;gap:12px;margin:22px 0}.quiz-accordion-item{overflow:hidden;border:1px solid rgba(213,255,239,.23);border-radius:18px;background:rgba(2,25,19,.61);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}.quiz-accordion-item.is-answered{border-color:rgba(122,244,212,.48)}.quiz-accordion-item.is-missing{border-color:var(--vision-error-border);box-shadow:0 0 0 1px rgba(255,129,116,.2),inset 0 1px 0 rgba(255,255,255,.06)}.quiz-accordion-header{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;align-items:center;width:100%;min-height:68px;gap:12px;padding:13px 15px;border:0;background:transparent;color:var(--vision-text);font:inherit;text-align:start;cursor:pointer}.quiz-accordion-header:hover{background:rgba(47,214,172,.1)}.quiz-accordion-header[aria-expanded=true]{background:rgba(47,214,172,.13)}.quiz-question-number{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(184,255,233,.36);border-radius:50%;color:var(--vision-teal-bright);font-size:13px;font-weight:850}.quiz-accordion-title{min-width:0;font-weight:800;line-height:1.35}.quiz-answer-status{justify-self:end;border:1px solid rgba(213,255,239,.22);border-radius:999px;padding:5px 9px;color:var(--vision-muted);font-size:12px;font-weight:750;line-height:1.2;white-space:nowrap}.is-answered .quiz-answer-status{border-color:rgba(122,244,212,.42);background:rgba(47,214,172,.13);color:var(--vision-teal-bright)}.is-missing .quiz-answer-status{border-color:rgba(255,129,116,.54);background:rgba(255,129,116,.12);color:var(--vision-error)}.quiz-accordion-arrow{width:22px;height:22px;fill:none;stroke:currentColor;stroke-linecap:round;stroke-linejoin:round;stroke-width:2;transition:transform .18s ease}.quiz-accordion-header[aria-expanded=true] .quiz-accordion-arrow{transform:rotate(180deg)}.quiz-accordion-panel{padding:4px 15px 17px;border-top:1px solid rgba(213,255,239,.16)}.quiz-accordion-panel .sub{margin:14px 0 16px}.quiz-accordion-panel .opt{margin:10px 0}.quiz-validation-message{margin:0 0 16px;color:var(--vision-error);font-size:14px;font-weight:750;line-height:1.5}.quiz-results-action{justify-content:flex-end}.quiz-results-action .btn{min-width:168px}.quiz-accordion-header:focus-visible{outline:3px solid var(--vision-focus);outline-offset:-3px}@media(max-width:520px){.quiz-accordion-header{grid-template-columns:auto minmax(0,1fr) auto;padding:13px}.quiz-answer-status{grid-column:2;justify-self:start;grid-row:2}.quiz-accordion-arrow{grid-column:3;grid-row:1 / span 2}.quiz-accordion-panel{padding-inline:13px}.quiz-results-action .btn{width:100%}}@media(prefers-reduced-motion:reduce){.quiz-accordion-arrow{transition:none}}
'''

replacements = [
    (
        "let lang='en',step=-1,answers=Array(totalQuestionCount).fill(null),participant={name:'',age:'',gender:''},resultStage='intro',revealedMatches={1:false,2:false};",
        "let lang='en',step=-1,answers=Array(totalQuestionCount).fill(null),participant={name:'',age:'',gender:''},resultStage='intro',revealedMatches={1:false,2:false},openQuestion=0,attemptedQuestionSubmit=false;",
    ),
    (
        "resultStage='intro';step=0;render()}",
        "resultStage='intro';openQuestion=0;attemptedQuestionSubmit=false;step=0;render()}",
    ),
    (
        "function restartQuiz(){answers=Array(totalQuestionCount).fill(null);participant={name:'',age:'',gender:''};resultStage='intro';revealedMatches={1:false,2:false};step=-1;render()}",
        "function restartQuiz(){answers=Array(totalQuestionCount).fill(null);participant={name:'',age:'',gender:''};resultStage='intro';revealedMatches={1:false,2:false};openQuestion=0;attemptedQuestionSubmit=false;step=-1;render()}",
    ),
    (
        "if(step===totalQuestionCount){resultStage==='detail'?renderResults():renderResultIntro();return}const q=DATA.q[step]",
        "if(step===totalQuestionCount){resultStage==='detail'?renderResults():renderResultIntro();return}if(step>=0&&step<totalQuestionCount){renderQuestionsAccordion();return}const q=DATA.q[step]",
    ),
]

for old, new in replacements:
    if old not in text:
        raise SystemExit(f'Missing expected source: {old[:80]}')
    text = text.replace(old, new, 1)

helpers = r'''
function toggleQuestion(index){openQuestion=openQuestion===index?-1:index;render()}
function chooseAccordionAnswer(questionIndex,optionIndex){answers[questionIndex]=optionIndex;openQuestion=questionIndex;render()}
function viewQuizResults(){const firstMissing=answers.findIndex(answer=>answer===null);if(firstMissing!==-1){attemptedQuestionSubmit=true;openQuestion=firstMissing;render();setTimeout(()=>{const header=$(`question-header-${firstMissing}`);if(!header)return;header.scrollIntoView({block:'center',behavior:reduceMotionQuery.matches?'auto':'smooth'});header.focus({preventScroll:true})},0);return}attemptedQuestionSubmit=false;revealedMatches={1:false,2:false};resultStage='intro';step=totalQuestionCount;render()}
function renderAccordionItem(question,index){const isColourBonus=index===colourQuestionIndex,answered=answers[index]!==null,missing=attemptedQuestionSubmit&&!answered,expanded=openQuestion===index,numberLabel=isColourBonus?L('11','١١'),title=question[lang==='en'?0:1],status=answered?L('Answered','تمت الإجابة'):missing?L('Answer required','الإجابة مطلوبة'):L('Not answered','لم تتم الإجابة بعد'),questionLabel=isColourBonus?L('Question 11 · Leadership colour','السؤال ١١ · لون القيادة'):L(`Question ${index+1}`,`السؤال ${index+1}`),options=question[4].map((option,optionIndex)=>{if(isColourBonus){const colour=DATA.sectors[DATA.colors[optionIndex]][2],selected=answers[index]===optionIndex;return `<button class="colorchoice ${selected?'selected':''}" style="--colour:${colour}" onclick="chooseAccordionAnswer(${index},${optionIndex})" aria-pressed="${selected}"><span class="swatch" aria-hidden="true"><span class="swatch-symbol">${selected?'✓':'✦'}</span></span><span class="color-copy"><span class="colorname">${esc(option[lang==='en'?0:1])}</span></span></button>`}return `<button class="opt ${answers[index]===optionIndex?'selected':''}" onclick="chooseAccordionAnswer(${index},${optionIndex})" aria-pressed="${answers[index]===optionIndex}"><span class="letter">${'ABCD'[optionIndex]}</span><span>${esc(option[lang==='en'?0:1])}</span></button>`}).join('');return `<section class="quiz-accordion-item ${answered?'is-answered':''} ${missing?'is-missing':''}"><button class="quiz-accordion-header" id="question-header-${index}" type="button" onclick="toggleQuestion(${index})" aria-expanded="${expanded}" aria-controls="question-panel-${index}"><span class="quiz-question-number" aria-hidden="true">${numberLabel}</span><span class="quiz-accordion-title"><span class="sr-only">${questionLabel}: </span>${esc(title)}</span><span class="quiz-answer-status">${status}</span><svg class="quiz-accordion-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m6 9 6 6 6-6"></path></svg></button><div class="quiz-accordion-panel" id="question-panel-${index}" role="region" aria-labelledby="question-header-${index}" ${expanded?'':'hidden'}><p class="sub">${esc(question[lang==='en'?2:3])}</p>${isColourBonus?`<div class="colorgrid">${options}</div>${answered?`<p class="bonus-selection-confirmation" role="status">${L('Selected','تم الاختيار')}</p>`:''}`:options}</div></section>`}
function renderQuestionsAccordion(){const answeredCount=answers.filter(answer=>answer!==null).length,items=DATA.q.map(renderAccordionItem).join('');$('app').innerHTML=`<div class="quiz-intro"><div class="eyebrow">${L('YOUR DISCOVERY','اكتشفي اهتماماتك')}</div><h1 class="h1">${L('Choose what feels most like you.','اختاري ما يشبهك أكثر.')}</h1><p class="sub">${L('Open each question, choose an answer, and return at any time to change it.','افتحي كل سؤال واختاري إجابة، ويمكنك العودة في أي وقت لتغييرها.')}</p><p class="small">${L(`${answeredCount} of ${totalQuestionCount} answered`,`تمت الإجابة عن ${answeredCount} من ${totalQuestionCount}`)}</p></div>${attemptedQuestionSubmit&&answeredCount<totalQuestionCount?`<p class="quiz-validation-message" role="status">${L('Complete the highlighted questions before viewing your results.','أجيبي عن الأسئلة المميزة قبل عرض نتيجتك.')}</p>`:''}<div class="quiz-accordion">${items}</div><div class="actions quiz-results-action"><button class="btn" type="button" onclick="viewQuizResults()">${L('View Results →','عرض النتائج ←')}</button></div>`}
'''

needle = "function render(){document.body.classList.toggle('welcome-view',step===-1);"
if needle not in text:
    raise SystemExit('Missing render function')
text = text.replace(needle, helpers + needle, 1)

needle = '\n\n</style></head>'
if needle not in text:
    raise SystemExit('Missing style end')
text = text.replace(needle, css + needle, 1)
path.write_text(text, encoding='utf-8')
