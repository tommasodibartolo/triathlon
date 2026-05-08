# KPI Research + Dashboard Representation Spec

## Design principle

The dashboard should not be a pretty activity log. It should answer three questions fast:

1. **Am I evolving?** Trend over time.
2. **Am I on track?** Delta to goal and required rate of change.
3. **What should change next?** One or two coach-level recommendations based on load, recovery, nutrition, and strength progression.

## Best visual representations

### 1. Executive KPI tiles

Use large numerical tiles with:
- current value
- delta vs target
- delta vs previous period
- 6–12 week sparkline
- color status: green = on track, amber = watch, red = intervention

Priority tiles:
- weekly training minutes
- weekly discipline completion: swim / bike / run / gym
- bike power / run pace evolution
- strength progression score
- nutrition compliance score
- recovery readiness score
- body composition delta once body data exists

### 2. Training load

Best visuals:
- daily load bars with 7-day moving average
- weekly stacked bars by discipline
- calendar heatmap for consistency
- CTL / ATL / TSB lines once TSS is available

Core KPIs:
- duration minutes
- distance
- calories
- average HR
- average power
- pace
- TSS / IF / NP when available
- zone distribution

### 3. Discipline-specific progress

**Bike**
- average power, normalized power, W/kg, cadence, HR efficiency
- chart: power trend + long ride duration trend

**Run**
- pace, HR, distance, brick run quality
- chart: pace vs HR scatter; lower HR at same pace = fitness gain

**Swim**
- pace per 100m, distance, SWOLF, stroke rate
- chart: pace trend + technique notes; currently missing source data

### 4. Strength / physique

Best visuals:
- progression table with previous → current → next target
- weekly tonnage by muscle group
- estimated 1RM trend for key lifts
- muscle-group balance radar

Core KPIs:
- rep mastery count
- load increases
- total sets per muscle group
- tonnage = sets × reps × load
- missed muscle groups: calves, core, mobility

### 5. Nutrition

Best visuals:
- daily macro bars vs target
- protein g/kg gauge
- calorie balance line
- meal timing flags around workouts

Core KPIs:
- kcal vs target
- protein grams and g/kg
- carbs grams and g/kg, especially pre/post endurance
- fat grams, especially correction after high-fat meals
- water and sodium once captured

### 6. Recovery

Best visuals:
- HRV + resting HR trend with baseline band
- sleep bar chart
- readiness gauge

Core KPIs:
- sleep hours
- HRV RMSSD
- resting HR
- subjective readiness
- soreness
- injury/illness flag

## Goal delta logic

Every goal should display:
- current value
- target value
- absolute delta
- percent complete
- deadline
- required weekly change
- projected achievement date from current trend

Examples:
- race time target: current estimate unknown → status = missing baseline test
- protein goal: needs body weight → status = missing weight
- strength target: DB shoulder press next target 50x8/8/8 → status = one rep short

## Missing data Tommaso did not mention / still needed

### Athlete profile
- height
- current body weight
- target body weight / look
- estimated body fat or photos cadence
- age
- timezone and training location constraints

### Race context
- exact triathlon date
- race distance confirmed: 70.3 assumed from handover
- target split by swim / bike / run / transitions
- course profile: elevation, weather, open-water conditions

### Training baselines
- FTP or recent cycling test
- run threshold pace or recent 5k/10k test
- swim CSS / threshold pace
- max HR or zones
- injury history

### Nutrition baselines
- daily calorie target
- current maintenance estimate
- protein target in grams
- carb strategy for long rides/runs
- hydration/sodium strategy
- supplements and caffeine tolerance

### Recovery sources
- sleep data
- HRV
- resting HR
- soreness/readiness score
- travel/work stress

### Data integrations
- Garmin / Strava / TrainingPeaks / Zwift / Apple Health source decision
- nutrition source: MyFitnessPal, Cronometer, MacroFactor, manual screenshots
- body composition source: scale, photos, DEXA/InBody, manual

## Dashboard status vocabulary

- **On track:** current trend reaches target by deadline.
- **Watch:** trend is improving but margin is thin or data quality is incomplete.
- **Intervention:** trend misses target, fatigue is too high, or data is insufficient for safe coaching.
- **Missing baseline:** cannot score until a test or measurement exists.

## Data quality KPI

Add one meta-KPI: **Data Quality Score**.

Calculation idea:
- workout complete = duration + discipline + at least one performance metric
- nutrition complete = kcal + protein + carbs + fat
- recovery complete = sleep + readiness or HRV/RHR
- body complete = weight or photo/body comp

This prevents false precision when screenshots/logs are incomplete.
