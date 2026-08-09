(() => {
  'use strict';

  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const i18n = window.CATCALC_I18N || {};
  const lang = document.documentElement.lang?.toLowerCase().startsWith('th') ? 'th' : 'en';
  const locale = lang === 'th' ? 'th-TH' : 'en-US';
  const fmt0 = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const fmt1 = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const fmt2 = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });

  const t = (key, vars = {}) => {
    let str = i18n[key] ?? key;
    Object.entries(vars).forEach(([k, v]) => { str = str.replaceAll(`{${k}}`, String(v)); });
    return str;
  };

  const state = { bcs: 5, foods: 1, lastResultText: '' };

  const el = {
    form: $('#catCalculator'),
    result: $('#resultPanel'),
    resultEmpty: $('#resultEmpty'),
    resultContent: $('#resultContent'),
    bcsDesc: $('#bcsDescription'),
    stage: $('#lifeStage'),
    lactationFields: $('#lactationFields'),
    targetWeightWrap: $('#targetWeightWrap'),
    trackFields: $('#trackingFields'),
    foodList: $('#foodList'),
    allocStatus: $('#allocationStatus'),
    addFood: $('#addFood'),
    calcBtn: $('#calculateBtn'),
    resetBtn: $('#resetBtn'),
    printBtn: $('#printResultBtn'),
    copyBtn: $('#copyResultBtn'),
    menuToggle: $('#menuToggle'),
    menu: $('#mainNav'),
  };

  const bcsDescriptions = {
    1: t('bcs1'), 2: t('bcs2'), 3: t('bcs3'), 4: t('bcs4'), 5: t('bcs5'),
    6: t('bcs6'), 7: t('bcs7'), 8: t('bcs8'), 9: t('bcs9')
  };

  const toKg = (value, unit) => unit === 'lb' ? value * 0.45359237 : value;
  const toMonths = (value, unit) => unit === 'years' ? value * 12 : value;
  const rer = kg => 70 * Math.pow(kg, 0.75);
  const catMetabolic = kg => Math.pow(kg, 0.67);
  const positive = n => Number.isFinite(n) && n > 0;
  const num = selector => parseFloat($(selector)?.value || '');
  const val = selector => $(selector)?.value || '';
  const checked = selector => !!$(selector)?.checked;
  const selectedRadio = name => $(`input[name="${name}"]:checked`)?.value || '';

  function updateBcs(value) {
    state.bcs = Number(value);
    $$('.bcs-scale button').forEach(btn => btn.classList.toggle('active', Number(btn.dataset.bcs) === state.bcs));
    el.bcsDesc.textContent = bcsDescriptions[state.bcs];
    const goal = $('#goal');
    if (goal && state.bcs >= 6 && goal.dataset.userTouched !== '1') goal.value = 'lose';
    if (goal && state.bcs <= 3 && goal.dataset.userTouched !== '1') goal.value = 'gain';
    if (goal && [4,5].includes(state.bcs) && goal.dataset.userTouched !== '1') goal.value = 'maintain';
    updateConditionalFields();
  }

  function updateConditionalFields() {
    const stage = val('#lifeStage');
    const goal = val('#goal');
    el.lactationFields?.classList.toggle('hidden', stage !== 'lactating');
    el.targetWeightWrap?.classList.toggle('hidden', goal !== 'lose');
  }

  function foodRowTemplate(index) {
    return `
      <div class="food-row" data-food-row="${index}">
        <label class="field food-name">
          <span>${t('foodName')}</span>
          <input type="text" class="food-name-input" placeholder="${t('foodNamePlaceholder')}" value="${index === 1 ? t('foodDefaultName') : ''}">
        </label>
        <label class="field">
          <span>${t('energy')}</span>
          <input type="number" class="food-energy" inputmode="decimal" min="0" step="any" placeholder="3800">
        </label>
        <label class="field">
          <span>${t('energyUnit')}</span>
          <select class="food-unit">
            <option value="kcalkg">kcal/kg</option>
            <option value="kcal100g">kcal/100 g</option>
            <option value="kcalg">kcal/g</option>
            <option value="kcalcup">kcal/cup</option>
            <option value="kcalcan">kcal/can</option>
            <option value="kcalpouch">kcal/pouch</option>
          </select>
        </label>
        <label class="field food-allocation">
          <span>${t('allocation')}</span>
          <input type="number" class="food-allocation-input" min="0" max="100" step="1" value="${index === 1 ? '100' : '0'}">
        </label>
        <button type="button" class="remove-food" aria-label="${t('removeFood')}" title="${t('removeFood')}">×</button>
      </div>`;
  }

  function addFood() {
    if (state.foods >= 4) return;
    state.foods += 1;
    el.foodList.insertAdjacentHTML('beforeend', foodRowTemplate(state.foods));
    bindFoodRows();
    rebalanceOnAdd();
  }

  function rebalanceOnAdd() {
    const rows = $$('.food-row', el.foodList);
    if (rows.length === 2) {
      rows[0].querySelector('.food-allocation-input').value = '50';
      rows[1].querySelector('.food-allocation-input').value = '50';
    }
    updateAllocationStatus();
  }

  function bindFoodRows() {
    $$('.food-row', el.foodList).forEach((row, idx, arr) => {
      const remove = $('.remove-food', row);
      remove.disabled = arr.length === 1;
      remove.onclick = () => {
        if ($$('.food-row', el.foodList).length <= 1) return;
        row.remove(); state.foods = $$('.food-row', el.foodList).length;
        const remaining = $$('.food-row', el.foodList);
        if (remaining.length === 1) $('.food-allocation-input', remaining[0]).value = '100';
        bindFoodRows(); updateAllocationStatus();
      };
      $('.food-allocation-input', row)?.addEventListener('input', updateAllocationStatus);
    });
  }

  function allocationTotal() {
    return $$('.food-allocation-input', el.foodList).reduce((sum, input) => sum + (parseFloat(input.value) || 0), 0);
  }

  function updateAllocationStatus() {
    const total = allocationTotal();
    const ok = Math.abs(total - 100) < 0.01;
    el.allocStatus.textContent = t('allocationStatus', { total: fmt0.format(total) });
    el.allocStatus.classList.toggle('bad', !ok);
  }

  function getFoods() {
    return $$('.food-row', el.foodList).map((row, idx) => ({
      name: $('.food-name-input', row).value.trim() || `${t('food')} ${idx + 1}`,
      energy: parseFloat($('.food-energy', row).value || ''),
      unit: $('.food-unit', row).value,
      allocation: parseFloat($('.food-allocation-input', row).value || '0')
    }));
  }

  function adultAaha(weightKg, neuter, lifestyle, obesityProne = false) {
    const base = rer(weightKg);
    if (obesityProne) return { low: base, high: base, point: base, factor: '1.0 × RER' };
    let low, high, point;
    if (neuter === 'neutered') {
      if (lifestyle === 'indoor') [low, high, point] = [1.2, 1.3, 1.2];
      else if (lifestyle === 'active') [low, high, point] = [1.3, 1.4, 1.4];
      else [low, high, point] = [1.2, 1.4, 1.3];
    } else if (neuter === 'intact') {
      if (lifestyle === 'indoor') [low, high, point] = [1.4, 1.5, 1.4];
      else if (lifestyle === 'active') [low, high, point] = [1.5, 1.6, 1.6];
      else [low, high, point] = [1.4, 1.6, 1.5];
    } else {
      [low, high, point] = [1.2, 1.6, lifestyle === 'active' ? 1.5 : 1.3];
    }
    return { low: base * low, high: base * high, point: base * point, factor: `${low.toFixed(1)}–${high.toFixed(1)} × RER` };
  }

  function adultFediaf(weightKg, neuter, lifestyle) {
    // FEDIAF 2025 Table VII-9 gives two evidence bands: neutered and/or indoor
    // cats at 52–75 kcal/kg^0.67, and active cats at 100 kcal/kg^0.67.
    // For an intact, mixed-activity cat, the 75–100 band below is explicitly a
    // bridge between those published categories rather than a third FEDIAF row.
    const m = catMetabolic(weightKg);
    if (neuter === 'neutered' || lifestyle === 'indoor') {
      return { low: 52*m, high: 75*m, point: 75*m, factor: '52–75 × kg^0.67' };
    }
    if (lifestyle === 'active') {
      return { low: 100*m, high: 100*m, point: 100*m, factor: '100 × kg^0.67' };
    }
    return { low: 75*m, high: 100*m, point: 87.5*m, factor: '75–100 × kg^0.67 (between FEDIAF bands)' };
  }

  function kittenFediaf(weightKg, ageMonths) {
    const adult = 100 * catMetabolic(weightKg);
    if (ageMonths <= 4) return { low: 2.0*adult, high:2.5*adult, point:2.25*adult, factor:'2.0–2.5 × MER' };
    if (ageMonths <= 9) return { low:1.75*adult, high:2.0*adult, point:1.875*adult, factor:'1.75–2.0 × MER' };
    return { low:1.5*adult, high:1.5*adult, point:1.5*adult, factor:'1.5 × MER' };
  }

  function gestationFediaf(weightKg) {
    const point = 140 * catMetabolic(weightKg);
    return { low: point, high: point, point, factor:'140 × kg^0.67' };
  }

  function lactationFediaf(weightKg, kittens, week) {
    const L = week <= 2 ? 0.9 : week <= 4 ? 1.2 : week === 5 ? 1.1 : week === 6 ? 1.0 : 0.8;
    const C = kittens < 3 ? 18 : kittens <= 4 ? 60 : 70;
    const point = 100 * catMetabolic(weightKg) + C * weightKg * L;
    return { low: point, high: point, point, factor:`100 × kg^0.67 + ${C} × kg × ${L}` };
  }

  function getTracking(weightKg) {
    const intake = num('#currentCalories');
    const previousRaw = num('#previousWeight');
    const previousUnit = val('#previousWeightUnit');
    const days = num('#trackingDays');
    const weighIns = Math.max(0, Math.floor(num('#weighInCount') || 0));
    if (!(positive(intake) && positive(previousRaw) && positive(days))) return null;
    const previousKg = toKg(previousRaw, previousUnit);
    if (!positive(previousKg) || days < 7) return null;
    const weeklyFraction = ((weightKg - previousKg) / previousKg) * (7 / days);
    return { intake, previousKg, days, weighIns, weeklyPct: weeklyFraction * 100, stable: Math.abs(weeklyFraction) <= 0.005 && days >= 14 && weighIns >= 3 };
  }

  function foodAmount(kcal, food) {
    if (!positive(food.energy)) return null;
    switch (food.unit) {
      case 'kcalkg': return { amount: kcal / (food.energy / 1000), unit: t('grams') };
      case 'kcal100g': return { amount: kcal / (food.energy / 100), unit: t('grams') };
      case 'kcalg': return { amount: kcal / food.energy, unit: t('grams') };
      case 'kcalcup': return { amount: kcal / food.energy, unit: t('cups') };
      case 'kcalcan': return { amount: kcal / food.energy, unit: t('cans') };
      case 'kcalpouch': return { amount: kcal / food.energy, unit: t('pouches') };
      default: return null;
    }
  }

  function collect() {
    const weightRaw = num('#weight');
    const weightUnit = val('#weightUnit');
    const ageRaw = num('#age');
    const ageUnit = val('#ageUnit');
    const weightKg = toKg(weightRaw, weightUnit);
    const ageMonths = toMonths(ageRaw, ageUnit);
    const lifeStageChoice = val('#lifeStage');
    const stage = lifeStageChoice === 'auto' ? (ageMonths < 12 ? 'kitten' : 'adult') : lifeStageChoice;
    return {
      name: val('#catName').trim(), weightKg, weightRaw, weightUnit, ageMonths, stage,
      sex: val('#sex'), neuter: val('#neuter'), lifestyle: val('#lifestyle'), goal: val('#goal'),
      bcs: state.bcs, mcs: val('#mcs'), meals: Math.max(1, Math.min(8, num('#meals') || 2)),
      treatPct: Math.max(0, Math.min(10, num('#treatPct') || 0)),
      medical: val('#medical') === 'yes', appetiteConcern: checked('#appetiteConcern'),
      targetWeightRaw: num('#targetWeight'), targetWeightUnit: val('#targetWeightUnit'),
      litterSize: Math.max(1, Math.min(10, num('#litterSize') || 3)), lactationWeek: Math.max(1, Math.min(8, num('#lactationWeek') || 3)),
      foods: getFoods(), tracking: getTracking(weightKg)
    };
  }

  function calculateModel(d) {
    const baseRer = rer(d.weightKg);
    const warnings = [];
    const notes = [];
    let primary = null, rangeLow = null, rangeHigh = null, modelName = '', aa = null, fe = null, idealKg = null, weightLossCohort = null, altStableLoss = null;
    let personalization = t('estimated');

    if (!positive(d.weightKg) || d.weightKg < 0.2 || d.weightKg > 30) throw new Error(t('weightError'));
    if (!positive(d.ageMonths) || d.ageMonths > 360) throw new Error(t('ageError'));

    if (d.appetiteConcern) warnings.push({type:'danger', text:t('appetiteWarning')});
    if (['pregnant','lactating'].includes(d.stage) && d.sex === 'male') throw new Error(t('sexStageError'));
    if (d.medical) warnings.push({type:'caution', text:t('medicalWarning')});
    if (d.mcs !== 'normal') warnings.push({type:'caution', text:t('muscleWarning')});
    if (d.bcs < 4) warnings.push({type:'caution', text:t('underweightWarning')});
    if (d.bcs > 5) warnings.push({type:'caution', text:t('overweightWarning')});
    if (d.ageMonths >= 144) notes.push(t('seniorNote'));
    if (d.ageMonths < 2) warnings.push({type:'danger', text:t('veryYoungWarning')});

    // Physiological life stage takes precedence over adult weight-change formulas.
    // Applying an adult 0.8×RER weight-loss equation to a growing kitten or a
    // pregnant/lactating queen would be inappropriate.
    if (d.stage === 'kitten') {
      if (d.ageMonths < 2) {
        primary = null;
        rangeLow = null;
        rangeHigh = null;
        modelName = t('fediafKitten');
      } else {
        fe = kittenFediaf(d.weightKg, d.ageMonths);
        aa = { low: 2.5*baseRer, high:2.5*baseRer, point:2.5*baseRer, factor:'2.5 × RER' };
        primary = fe.point;
        rangeLow = Math.min(fe.low, aa.low);
        rangeHigh = Math.max(fe.high, aa.high);
      }
      notes.push(t('kittenNote'));
      if (d.goal !== 'maintain') warnings.push({type:'caution', text:t('kittenGoalWarning')});
    } else if (d.stage === 'pregnant') {
      fe = gestationFediaf(d.weightKg);
      aa = { low:1.6*baseRer, high:2.0*baseRer, point:1.8*baseRer, factor:'1.6–2.0 × RER' };
      primary = fe.point; rangeLow = Math.min(fe.low, aa.low); rangeHigh = Math.max(fe.high, aa.high); modelName=t('fediafGestation');
      warnings.push({type:'caution', text:t('reproductionWarning')});
    } else if (d.stage === 'lactating') {
      fe = lactationFediaf(d.weightKg, d.litterSize, d.lactationWeek);
      aa = { low:2.0*baseRer, high:6.0*baseRer, point:4.0*baseRer, factor:'2.0–6.0 × RER' };
      primary = fe.point; rangeLow = Math.min(fe.low, aa.low); rangeHigh = Math.max(fe.high, aa.high); modelName=t('fediafLactation');
      warnings.push({type:'caution', text:t('reproductionWarning')});
    } else if (d.goal === 'lose') {
      const enteredTargetKg = positive(d.targetWeightRaw) ? toKg(d.targetWeightRaw, d.targetWeightUnit) : null;
      // A user-entered target is treated as vet-confirmed only if it is plausible
      // and below current weight; otherwise the BCS relationship is used.
      const enteredTarget = enteredTargetKg && enteredTargetKg >= 0.5 && enteredTargetKg < d.weightKg ? enteredTargetKg : null;
      if (enteredTarget) idealKg = enteredTarget;
      else if (d.bcs >= 6) idealKg = d.weightKg / (1 + 0.10 * (d.bcs - 5));
      if (!idealKg) {
        primary = null;
        warnings.push({type:'danger', text:t('lossNeedsTarget')});
      } else {
        const idealRer = rer(idealKg);
        primary = 0.8 * idealRer;
        rangeLow = primary;
        rangeHigh = primary;
        modelName = t('aahaWeightLoss');
        weightLossCohort = 52 * Math.pow(idealKg, 0.711);
        if (d.tracking?.stable) altStableLoss = 0.8 * d.tracking.intake;
        notes.push(t('lossRateNote'));
        if (d.bcs === 9 && !enteredTarget) notes.push(t('bcs9TargetNote'));
      }
    } else if (d.goal === 'gain') {
      aa = adultAaha(d.weightKg, d.neuter, d.lifestyle, false);
      fe = adultFediaf(d.weightKg, d.neuter, d.lifestyle);
      primary = fe.point;
      rangeLow = Math.min(fe.low, aa.low);
      rangeHigh = Math.max(fe.high, aa.high);
      modelName = t('maintenanceReference');
      warnings.push({type:'caution', text:t('gainWarning')});
    } else {
      const obesityProne = d.bcs > 5 && d.goal === 'maintain';
      aa = adultAaha(d.weightKg, d.neuter, d.lifestyle, obesityProne);
      fe = adultFediaf(d.weightKg, d.neuter, d.lifestyle);
      primary = fe.point;
      rangeLow = Math.min(fe.low, aa.low);
      rangeHigh = Math.max(fe.high, aa.high);
      modelName=t('fediafAdult');
      if (d.tracking?.stable && [4,5].includes(d.bcs) && !d.medical && !d.appetiteConcern && d.mcs === 'normal') {
        primary = d.tracking.intake;
        rangeLow = d.tracking.intake * 0.95;
        rangeHigh = d.tracking.intake * 1.05;
        modelName = t('observedMaintenance');
        personalization = t('observed');
        notes.push(t('observedNote'));
      } else if (d.tracking) {
        personalization = t('informed');
        notes.push(t('trackingTrend', { pct: `${d.tracking.weeklyPct >= 0 ? '+' : ''}${fmt2.format(d.tracking.weeklyPct)}` }));
      }
    }

    if (d.tracking && d.goal === 'lose') {
      const p = Math.abs(d.tracking.weeklyPct);
      if (d.tracking.weeklyPct < -2) warnings.push({type:'danger', text:t('lossTooFast')});
      else if (d.tracking.weeklyPct < -0.5) notes.push(t('lossOnPace'));
    }

    const treatKcal = positive(primary) ? primary * d.treatPct / 100 : 0;
    const mealFoodKcal = positive(primary) ? primary - treatKcal : 0;
    const foods = [];
    const alloc = d.foods.reduce((s,f)=>s+(f.allocation||0),0);
    const allocationValid = Math.abs(alloc - 100) < 0.01;
    if (!allocationValid && d.foods.some(f => positive(f.energy))) warnings.push({type:'caution', text:t('allocationWarning')});
    if (allocationValid && positive(mealFoodKcal)) {
      d.foods.forEach(food => {
        if (!positive(food.energy) || food.allocation <= 0) return;
        const kcal = mealFoodKcal * food.allocation / 100;
        const amount = foodAmount(kcal, food);
        if (amount) foods.push({...food, kcal, amount, perMeal: amount.amount / d.meals});
      });
    }

    if (d.treatPct > 10) warnings.push({type:'caution', text:t('treatWarning')});

    return { ...d, baseRer, primary, rangeLow, rangeHigh, modelName, aa, fe, idealKg, weightLossCohort, altStableLoss, warnings, notes, treatKcal, mealFoodKcal, foods, personalization };
  }

  function render(r) {
    el.resultEmpty.classList.add('hidden');
    el.resultContent.classList.remove('hidden');
    const cat = r.name ? r.name : t('yourCat');
    $('#resultKicker').textContent = t('resultFor', { cat });
    $('#resultNumber').textContent = positive(r.primary) ? fmt0.format(r.primary) : '—';
    $('#resultRange').textContent = positive(r.rangeLow) && positive(r.rangeHigh)
      ? (Math.abs(r.rangeHigh-r.rangeLow) < 1 ? t('singleEstimate', { model:r.modelName }) : t('estimateRange', { low:fmt0.format(r.rangeLow), high:fmt0.format(r.rangeHigh), model:r.modelName }))
      : t('noPrescription');

    $('#confidenceBadge').textContent = `${t('personalization')}: ${r.personalization}`;
    $('#confidenceBadge').classList.toggle('warn', r.personalization === t('estimated'));
    $('#metricRer').textContent = `${fmt0.format(r.baseRer)} kcal`;
    $('#metricWeight').textContent = `${fmt2.format(r.weightKg)} kg`;
    $('#metricFoodKcal').textContent = positive(r.primary) ? `${fmt0.format(r.mealFoodKcal)} kcal` : '—';
    $('#metricTreats').textContent = positive(r.primary) ? `${fmt0.format(r.treatKcal)} kcal` : '—';

    const compare = $('#modelCompare');
    const rows = [];
    if (r.fe) rows.push(`<div class="model-row"><span>${t('fediafReference')} · ${r.fe.factor}</span><strong>${fmt0.format(r.fe.point)} kcal/day</strong></div>`);
    if (r.aa) rows.push(`<div class="model-row"><span>${t('aahaReference')} · ${r.aa.factor}</span><strong>${fmt0.format(r.aa.point)} kcal/day</strong></div>`);
    if (r.idealKg) rows.push(`<div class="model-row"><span>${t('estimatedIdealWeight')}</span><strong>${fmt2.format(r.idealKg)} kg</strong></div>`);
    if (r.weightLossCohort) rows.push(`<div class="model-row"><span>${t('cohortReference')}</span><strong>${fmt0.format(r.weightLossCohort)} kcal/day</strong></div>`);
    if (r.altStableLoss) rows.push(`<div class="model-row"><span>${t('stableIntakeAlternative')}</span><strong>${fmt0.format(r.altStableLoss)} kcal/day</strong></div>`);
    if (r.tracking) rows.push(`<div class="model-row"><span>${t('weeklyTrend')}</span><strong>${r.tracking.weeklyPct >= 0 ? '+' : ''}${fmt2.format(r.tracking.weeklyPct)}%</strong></div>`);
    compare.innerHTML = rows.length ? `<h3>${t('calculationDetails')}</h3>${rows.join('')}` : '';

    const warningBox = $('#resultNotices');
    warningBox.innerHTML = [...r.warnings.map(w => `<div class="notice ${w.type}">${w.text}</div>`), ...r.notes.map(n => `<div class="notice info">${n}</div>`)].join('');

    const foodBox = $('#foodResults');
    if (r.foods.length) {
      foodBox.innerHTML = `<h3>${t('feedingAmounts')}</h3>` + r.foods.map(f => {
        const amountDigits = f.amount.unit === t('grams') ? 0 : 2;
        const format = amountDigits === 0 ? fmt0 : fmt2;
        return `<div class="food-result-row"><span>${escapeHtml(f.name)} · ${fmt0.format(f.kcal)} kcal/day</span><strong>${format.format(f.amount.amount)} ${f.amount.unit}/day<br><small>${format.format(f.perMeal)} ${f.amount.unit}/${t('meal')}</small></strong></div>`;
      }).join('');
    } else {
      foodBox.innerHTML = `<h3>${t('feedingAmounts')}</h3><div class="notice info">${t('enterFoodEnergy')}</div>`;
    }

    state.lastResultText = buildPlainText(r);
    el.result.scrollIntoView({ behavior:'smooth', block:'nearest' });
  }

  function buildPlainText(r) {
    const lines = [
      `${t('toolName')} — ${r.name || t('yourCat')}`,
      `${t('dailyCalories')}: ${positive(r.primary) ? fmt0.format(r.primary) + ' kcal/day' : '—'}`,
      `${t('rerLabel')}: ${fmt0.format(r.baseRer)} kcal/day`,
      `${t('weightLabel')}: ${fmt2.format(r.weightKg)} kg`,
      `${t('bcsLabel')}: ${r.bcs}/9`,
      `${t('modelLabel')}: ${r.modelName}`,
    ];
    r.foods.forEach(f => lines.push(`${f.name}: ${fmt0.format(f.kcal)} kcal/day → ${f.amount.unit === t('grams') ? fmt0.format(f.amount.amount) : fmt2.format(f.amount.amount)} ${f.amount.unit}/day`));
    lines.push('', t('educationalDisclaimer'));
    return lines.join('\n');
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function calculate(e) {
    e?.preventDefault();
    try {
      updateAllocationStatus();
      const data = collect();
      const result = calculateModel(data);
      render(result);
    } catch (err) {
      el.resultEmpty.classList.add('hidden');
      el.resultContent.classList.remove('hidden');
      $('#resultKicker').textContent = t('checkInputs');
      $('#resultNumber').textContent = '—';
      $('#resultRange').textContent = err.message || t('inputError');
      $('#confidenceBadge').textContent = t('needsInput');
      $('#confidenceBadge').classList.add('warn');
      $('#metricRer').textContent = '—'; $('#metricWeight').textContent = '—'; $('#metricFoodKcal').textContent='—'; $('#metricTreats').textContent='—';
      $('#modelCompare').innerHTML=''; $('#foodResults').innerHTML=''; $('#resultNotices').innerHTML='';
    }
  }

  function reset() {
    el.form.reset(); state.bcs = 5;
    el.foodList.innerHTML = foodRowTemplate(1); state.foods=1; bindFoodRows(); updateAllocationStatus(); updateBcs(5); updateConditionalFields();
    el.resultContent.classList.add('hidden'); el.resultEmpty.classList.remove('hidden');
    $('#goal').dataset.userTouched='0';
  }

  async function copyResult() {
    if (!state.lastResultText) return;
    try {
      await navigator.clipboard.writeText(state.lastResultText);
      const old=el.copyBtn.textContent; el.copyBtn.textContent=t('copied'); setTimeout(()=>el.copyBtn.textContent=old,1500);
    } catch { /* browser may block clipboard on file:// */ }
  }

  function init() {
    // Mobile navigation is shared by the calculator and the /tools/ hub.
    el.menuToggle?.addEventListener('click', () => {
      const open=el.menu?.classList.toggle('open'); el.menuToggle.setAttribute('aria-expanded', open ? 'true':'false');
    });
    if (!el.form) return;
    $$('.bcs-scale button').forEach(btn => btn.addEventListener('click', () => updateBcs(btn.dataset.bcs)));
    $('#goal')?.addEventListener('change', e => { e.currentTarget.dataset.userTouched='1'; updateConditionalFields(); });
    el.stage?.addEventListener('change', updateConditionalFields);
    el.addFood?.addEventListener('click', addFood);
    el.form.addEventListener('submit', calculate);
    el.resetBtn?.addEventListener('click', reset);
    el.printBtn?.addEventListener('click', () => window.print());
    el.copyBtn?.addEventListener('click', copyResult);
    bindFoodRows(); updateAllocationStatus(); updateBcs(5); updateConditionalFields();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
