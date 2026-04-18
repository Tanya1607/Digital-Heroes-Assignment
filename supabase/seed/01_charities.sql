-- GolfDraw · seed charities
insert into public.charities (slug, name, tagline, description, featured, hero_img, events) values
('hopeline', 'HopeLine', 'Mental health support, one call at a time',
 'HopeLine provides 24/7 mental health support via trained volunteer counsellors, reaching over 80,000 callers last year.',
 true, 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200',
 '[{"title":"Spring Charity Golf Day","date":"2026-05-18","location":"The Belfry"}]'::jsonb),

('greenfields', 'Greenfields Trust', 'Protecting community green spaces',
 'Greenfields Trust safeguards urban parks and funds restoration of community green spaces across the UK.',
 true, 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200',
 '[{"title":"Clean-up Weekend","date":"2026-06-07","location":"Epping Forest"}]'::jsonb),

('braveheart-kids', 'Braveheart Kids', 'Supporting children with serious illness',
 'Braveheart Kids funds family accommodation, respite and therapy for children undergoing long-term treatment.',
 false, 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200',
 '[]'::jsonb),

('open-tide', 'Open Tide', 'Ocean conservation and coastal cleanup',
 'Open Tide runs beach cleanups and funds plastic-recovery research across European coastlines.',
 false, 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200',
 '[{"title":"Cornwall Coast Cleanup","date":"2026-05-25","location":"Fistral Beach"}]'::jsonb),

('warm-homes', 'Warm Homes Initiative', 'Fuel poverty relief for older adults',
 'Warm Homes Initiative funds emergency heating grants and draft-proofing for pensioners during winter months.',
 false, 'https://images.unsplash.com/photo-1501183638710-841dd1904471?w=1200',
 '[]'::jsonb),

('reach-literacy', 'Reach Literacy', 'Adult literacy and numeracy',
 'Reach Literacy offers free literacy programmes for adults, pairing learners with trained volunteer tutors.',
 false, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200',
 '[]'::jsonb)
on conflict (slug) do nothing;
