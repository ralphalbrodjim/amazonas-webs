-- The Cambridge House · prompts and answer keys.
-- Run AFTER 20261121120000_ch_schema.sql.
-- Keys go only into ch_exercise_answers. The bank table has the prompt and the options, never the key.

insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('plc-1', 'placement', 1, 'choice', 'If she had left earlier, she ___ the delay.', '["would have avoided", "will avoid", "has avoided"]'::jsonb, 'Third conditional', 'diagnóstico', null, null, null, 0)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["would have avoided"]'::jsonb, '[]'::jsonb, null, 'Third conditional: would have + past participle. 1 punto. No es una nota oficial.'
from public.ch_exercise_bank where code = 'plc-1'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('plc-2', 'placement', 2, 'text', '“It is not necessary for you to print the form.” → “You ____ print the form.”', null, 'Modality', 'diagnóstico', null, null, null, 1)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["do not have to", "don''t have to", "dont have to", "need not"]'::jsonb, '[]'::jsonb, null, 'do not have to, don''t have to o need not. 1 punto. No significa prohibido.'
from public.ch_exercise_bank where code = 'plc-2'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('plc-3', 'placement', 5, 'choice', 'Read: “The pilot scheme was small, yet the later figures contradicted the early doubts.” What happened?', '["Later evidence challenged the first doubts.", "The scheme was cancelled at once.", "The early doubts were all confirmed."]'::jsonb, 'Inference', 'diagnóstico', null, null, null, 2)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["Later evidence challenged the first doubts."]'::jsonb, '[]'::jsonb, null, '“Contradicted the early doubts” means the later figures went against them. 2 puntos.'
from public.ch_exercise_bank where code = 'plc-3'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('plc-4', 'placement', 3, 'text', 'The argument was not _____ enough to change the vote. (PERSUADE)', null, 'Word formation', 'diagnóstico', null, null, null, 3)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["persuasive"]'::jsonb, '[]'::jsonb, null, 'persuasive. 1 punto.'
from public.ch_exercise_bank where code = 'plc-4'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('plc-5', 'placement', 8, 'choice', 'We need to _____ the pros and cons before we decide.', '["weigh up", "take off", "bring out"]'::jsonb, 'Collocation', 'diagnóstico', null, null, null, 4)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["weigh up"]'::jsonb, '[]'::jsonb, null, 'weigh up = consider both sides. 1 punto.'
from public.ch_exercise_bank where code = 'plc-5'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('plc-6', 'placement', 4, 'text', '“I regret not taking that opportunity.” Keyword: WISH. Use 3 to 6 words.', null, 'wish + past perfect', 'diagnóstico', null, null, null, 5)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["I wish I had taken that opportunity"]'::jsonb, '["I wish I took that opportunity", "I wish I had taken the opportunity"]'::jsonb, 'WISH', '2 puntos si coincide con la clave. 1 punto si la estructura es casi correcta. Otra frase con WISH queda en revisión.'
from public.ch_exercise_bank where code = 'plc-6'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p1-a', 'grammar', 1, 'choice', 'Part 1 · If the train ___ on time, we would not have missed the talk.', '["had arrived", "arrives", "will arrive"]'::jsonb, 'Third conditional', 'C1', null, null, null, 6)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["had arrived"]'::jsonb, '[]'::jsonb, null, 'had arrived. Third conditional. 1 punto.'
from public.ch_exercise_bank where code = 'p1-a'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p1-b', 'grammar', 1, 'choice', 'Part 1 · She asked me where I ___ the previous summer.', '["had spent", "spend", "will spend"]'::jsonb, 'Reported speech', 'C1', null, null, null, 7)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["had spent"]'::jsonb, '[]'::jsonb, null, 'had spent. Backshift after asked. 1 punto.'
from public.ch_exercise_bank where code = 'p1-b'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p2-a', 'grammar', 2, 'text', 'Part 2 · “It is not necessary for applicants to send a portfolio.” → “Applicants ____ send a portfolio.”', null, 'Modality', 'C1', null, null, null, 8)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["do not have to", "don''t have to", "dont have to", "need not"]'::jsonb, '[]'::jsonb, null, 'do not have to / don''t have to / need not. 1 punto.'
from public.ch_exercise_bank where code = 'p2-a'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p2-b', 'grammar', 2, 'text', 'Part 2 · “People in general agree.” → “_____ people agree.”', null, 'Articles and reference', 'C1', null, null, null, 9)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["most", "most of the"]'::jsonb, '[]'::jsonb, null, 'most, o most of the si el grupo ya está definido. 1 punto.'
from public.ch_exercise_bank where code = 'p2-b'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p3-a', 'grammar', 3, 'text', 'Part 3 · Her _____ of the figures was careful and fair. (ANALYSE)', null, 'Word formation', 'C1', null, null, null, 10)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["analysis"]'::jsonb, '[]'::jsonb, null, 'analysis. 1 punto.'
from public.ch_exercise_bank where code = 'p3-a'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p3-b', 'grammar', 3, 'text', 'Part 3 · The proposal looked _____ until the trial data arrived. (PRACTICE)', null, 'Word formation', 'C1', null, null, null, 11)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["impractical", "impracticable"]'::jsonb, '[]'::jsonb, null, 'impractical o impracticable. 1 punto.'
from public.ch_exercise_bank where code = 'p3-b'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p4-a', 'grammar', 4, 'text', 'Part 4 · “I regret not taking that opportunity.” Keyword: WISH. Use 3 to 6 words.', null, 'wish + past perfect', 'C1', null, null, null, 12)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["I wish I had taken that opportunity"]'::jsonb, '["I wish I took that opportunity", "I wish I had taken the opportunity"]'::jsonb, 'WISH', '2 puntos con la clave completa. 1 punto si falta poco. Otra frase con WISH queda en revisión, no como fallo automático.'
from public.ch_exercise_bank where code = 'p4-a'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p4-b', 'grammar', 4, 'text', 'Part 4 · “Although the brief was short, the report was clear.” Keyword: DESPITE. Use 3 to 6 words.', null, 'despite + noun', 'C1', null, null, null, 13)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["Despite the brief being short", "Despite the short brief"]'::jsonb, '["Despite the brief was short"]'::jsonb, 'DESPITE', 'Despite + noun phrase. “Despite the brief was short” no es una clave completa: 1 punto si está en la lista parcial. Otra frase con DESPITE queda en revisión.'
from public.ch_exercise_bank where code = 'p4-b'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p5-a', 'reading', 5, 'choice', 'Part 5 · “While flexible hours have widened the pool of applicants, managers still miss informal knowledge-sharing.” What is the writer’s main point?', '["Flexible hours have only disadvantages.", "They bring a benefit and a difficulty.", "Managers refuse every applicant."]'::jsonb, 'Main point', 'C1', null, null, null, 14)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["They bring a benefit and a difficulty."]'::jsonb, '[]'::jsonb, null, 'While sets up a contrast. 2 puntos.'
from public.ch_exercise_bank where code = 'p5-a'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p5-b', 'reading', 5, 'choice', 'Part 5 · “The first draft was dismissed as unrealistic, yet the next trial weakened that view.” What did the trial do?', '["It gave a reason to look again.", "It closed the project for good.", "It proved every objection."]'::jsonb, 'Detail', 'C1', null, null, null, 15)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["It gave a reason to look again."]'::jsonb, '[]'::jsonb, null, 'Weakened that view = the objection lost force. 2 puntos.'
from public.ch_exercise_bank where code = 'p5-b'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p6-a', 'reading', 6, 'choice', 'Part 6 · Text A praises remote work for deep focus. Text B says new staff learn less without a shared room. Which comment matches both?', '["Both see only gains.", "They disagree about what the workplace is for.", "Both want to ban offices."]'::jsonb, 'Cross-text', 'C1', null, null, null, 16)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["They disagree about what the workplace is for."]'::jsonb, '[]'::jsonb, null, 'A values focus; B values learning together. 2 puntos.'
from public.ch_exercise_bank where code = 'p6-a'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p6-b', 'reading', 6, 'choice', 'Part 6 · Review A calls the tool “a useful extra”. Review B calls it “a distraction dressed up as progress”. What do they share?', '["They use the same judgement.", "They are both talking about the tool’s effect, not its price.", "They both demand a refund."]'::jsonb, 'Attitude', 'C1', null, null, null, 17)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["They are both talking about the tool’s effect, not its price."]'::jsonb, '[]'::jsonb, null, 'Neither review mentions price. 2 puntos.'
from public.ch_exercise_bank where code = 'p6-b'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p7-a', 'reading', 7, 'choice', 'Part 7 · “The team missed the informal cues. _____ the chair started a short Monday briefing.” Which sentence fits the gap?', '["For this reason", "In spite of this failure being irrelevant", "This proved the budget was the cause"]'::jsonb, 'Gap', 'C1', null, null, null, 18)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["For this reason"]'::jsonb, '[]'::jsonb, null, 'The briefing is a response to the missed cues. 2 puntos.'
from public.ch_exercise_bank where code = 'p7-a'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p7-b', 'reading', 7, 'choice', 'Part 7 · “Attendance at the trial was low. _____ the organisers extended it by a week.”', '["Consequently", "Otherwise", "In contrast to a surplus"]'::jsonb, 'Gap', 'C1', null, null, null, 19)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["Consequently"]'::jsonb, '[]'::jsonb, null, 'The extension follows from the low attendance. 2 puntos.'
from public.ch_exercise_bank where code = 'p7-b'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p8-a', 'reading', 8, 'choice', 'Part 8 · Which person is speaking? “I only changed my mind after the second set of figures.”', '["Someone persuaded by later evidence.", "Someone who never saw the figures.", "Someone who ignored both sets."]'::jsonb, 'Multiple matching', 'C1', null, null, null, 20)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["Someone persuaded by later evidence."]'::jsonb, '[]'::jsonb, null, 'The second set of figures changed the decision. 1 punto.'
from public.ch_exercise_bank where code = 'p8-a'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('p8-b', 'reading', 8, 'choice', 'Part 8 · Which person is speaking? “I would rather keep one day in the office so new colleagues can ask quick questions.”', '["Someone arguing for a hybrid week.", "Someone who wants fully remote work.", "Someone closing the office for good."]'::jsonb, 'Multiple matching', 'C1', null, null, null, 21)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["Someone arguing for a hybrid week."]'::jsonb, '[]'::jsonb, null, 'One day in the office plus remote time is a hybrid arrangement. 1 punto.'
from public.ch_exercise_bank where code = 'p8-b'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('lis-1', 'listening', 1, 'choice', 'Listening · Part 1 · Open the British Council C1 listening page (British accent). Then answer this original question about the task, not about a copied transcript: a gist question asks you to identify…', '["the main idea of the whole clip", "a single spelled name only", "the speaker’s shoe size"]'::jsonb, 'Gist', 'C1', 'https://learnenglish.britishcouncil.org/free-resources/listening/c1', 'British', '15–20 min', 22)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["the main idea of the whole clip"]'::jsonb, '[]'::jsonb, null, 'A Part 1 gist item asks for the main idea. 1 punto. Solo cuenta si el audio real se abrió.'
from public.ch_exercise_bank where code = 'lis-1'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('lis-2', 'listening', 2, 'choice', 'Listening · Part 2 · Open ELLLO (varied accents, about 3–5 minutes). A detail question is usually answered by…', '["a specific fact in the clip", "the title of the website alone", "a guess before listening"]'::jsonb, 'Detail', 'C1', 'https://www.elllo.org/', 'variado', '3–5 min', 23)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["a specific fact in the clip"]'::jsonb, '[]'::jsonb, null, 'Part 2 detail items depend on a fact you heard. 1 punto. Solo cuenta con el audio real.'
from public.ch_exercise_bank where code = 'lis-2'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('lis-3', 'listening', 3, 'choice', 'Listening · Part 3 · Open VOA Learning English (American accent). An inference item asks you to…', '["conclude something the speaker implies", "copy the headline only", "ignore the audio"]'::jsonb, 'Inference', 'C1', 'https://learningenglish.voanews.com/', 'americano', 'variable', 24)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["conclude something the speaker implies"]'::jsonb, '[]'::jsonb, null, 'Inference goes beyond a repeated sentence. 1 punto. Solo cuenta con el audio real. Algunos audios de VOA están por debajo de C1.'
from public.ch_exercise_bank where code = 'lis-3'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('lis-4', 'listening', 4, 'choice', 'Listening · Part 4 · Open a TED talk (link only; do not download it). An attitude item asks…', '["how the speaker feels about the idea", "the number of slides in the talk", "the price of a ticket"]'::jsonb, 'Attitude', 'C1', 'https://www.ted.com/talks', 'varios', 'variable', 25)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["how the speaker feels about the idea"]'::jsonb, '[]'::jsonb, null, 'Attitude is the speaker’s stance. 1 punto. Solo cuenta con el audio real. TED se abre en origen.'
from public.ch_exercise_bank where code = 'lis-4'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('voc-1', 'vocab', null, 'choice', 'Which option completes the sentence? “We need a _____ argument, not a louder one.”', '["compelling", "optional", "repetitive"]'::jsonb, 'Collocation', 'C1', null, null, null, 26)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["compelling"]'::jsonb, '[]'::jsonb, null, 'compelling = convincing. 1 punto.'
from public.ch_exercise_bank where code = 'voc-1'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('voc-2', 'vocab', null, 'choice', '“A trade-off” is closest to…', '["a balance between two costs", "a free upgrade", "a spelling mistake"]'::jsonb, 'Collocation', 'C1', null, null, null, 27)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["a balance between two costs"]'::jsonb, '[]'::jsonb, null, 'A trade-off exchanges one benefit for another. 1 punto.'
from public.ch_exercise_bank where code = 'voc-2'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('muestra-1', 'exam', 1, 'choice', 'If she had told me earlier, I ____ helped.', '["will have", "would have", "had"]'::jsonb, 'Third conditional', 'C1', null, null, null, 28)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["would have"]'::jsonb, '[]'::jsonb, null, 'would have. 1 punto. Esto es la muestra de 3 preguntas, no el mini simulacro de 45 minutos.'
from public.ch_exercise_bank where code = 'muestra-1'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('muestra-2', 'exam', 8, 'choice', 'Choose the best synonym of “compelling”.', '["convincing", "optional", "repetitive"]'::jsonb, 'Vocabulary', 'C1', null, null, null, 29)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["convincing"]'::jsonb, '[]'::jsonb, null, 'convincing. 1 punto. Muestra.'
from public.ch_exercise_bank where code = 'muestra-2'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;
insert into public.ch_exercise_bank (code, skill, part, type, prompt, options, grammar, level, audio_url, accent, duration_label, sort)
values ('muestra-3', 'exam', 1, 'choice', 'No sooner ____ the presentation than the questions began.', '["she finished", "had she finished", "she had finished"]'::jsonb, 'Inversion', 'C1', null, null, null, 30)
on conflict (code) do update set prompt = excluded.prompt, options = excluded.options, grammar = excluded.grammar, audio_url = excluded.audio_url, accent = excluded.accent, duration_label = excluded.duration_label, sort = excluded.sort;
insert into public.ch_exercise_answers (exercise_id, answers, partial, keyword, explanation)
select id, '["had she finished"]'::jsonb, '[]'::jsonb, null, 'had she finished. Inversion after No sooner. 1 punto. Muestra.'
from public.ch_exercise_bank where code = 'muestra-3'
on conflict (exercise_id) do update set answers = excluded.answers, partial = excluded.partial, keyword = excluded.keyword, explanation = excluded.explanation;

insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('cam-c1', 'Cambridge English · C1 Advanced', 'Cambridge English', 'https://www.cambridgeenglish.org/exams-and-tests/qualifications/advanced/preparation/', 'Examen', 'British', 'C1', 'variable', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('bc-listen', 'British Council · C1 Listening', 'British Council', 'https://learnenglish.britishcouncil.org/free-resources/listening/c1', 'Listening', 'British', 'C1', '15–20 min', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('bc-read', 'British Council · C1 Reading', 'British Council', 'https://learnenglish.britishcouncil.org/free-resources/reading/c1', 'Reading', 'British', 'C1', 'variable', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('bc-write', 'British Council · C1 Writing', 'British Council', 'https://learnenglish.britishcouncil.org/free-resources/writing/c1', 'Writing', 'British', 'C1', 'variable', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('bc-gram', 'British Council · Grammar', 'British Council', 'https://learnenglish.britishcouncil.org/grammar', 'Grammar', 'British', 'B2–C1', 'variable', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('voa', 'VOA Learning English', 'VOA', 'https://learningenglish.voanews.com/', 'Listening', 'americano', 'variable', 'variable', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('bbc', 'BBC Learning English', 'BBC', 'https://www.bbc.co.uk/learningenglish', 'General', 'British', 'variable', 'variable', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('elllo', 'ELLLO', 'ELLLO', 'https://www.elllo.org/', 'Listening', 'variado', 'C1', '3–5 min', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('oxford', 'Oxford Online English', 'Oxford', 'https://www.oxfordonlineenglish.com/free-english-lessons', 'General', 'British', 'variable', 'variable', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('ted', 'TED Talks', 'TED', 'https://www.ted.com/talks', 'Listening', 'varios', 'C1', 'variable', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('nil', 'News in Levels', 'News in Levels', 'https://www.newsinlevels.com/', 'Listening', 'varios', 'graduado', 'variable', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
insert into public.ch_resource_catalog (code, title, provider, url, skill, accent, level, duration_label, license_status, can_host_media)
values ('dict', 'Cambridge Dictionary', 'Cambridge', 'https://dictionary.cambridge.org/', 'Vocabulario', 'British', 'consulta', 'consulta', 'link_only', false)
on conflict (code) do update set title = excluded.title, url = excluded.url, accent = excluded.accent, level = excluded.level, duration_label = excluded.duration_label;
