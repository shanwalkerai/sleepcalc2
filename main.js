import Chart from 'chart.js/auto'; // Import Chart.js
    import flatpickr from "flatpickr"; // Import flatpickr

    // --- Global Config Variable ---
    let config = {}; // Will be populated by fetchConfig

    // --- DOM Elements ---
    const getElement = (id) => document.getElementById(id);
    const querySelector = (selector) => document.querySelector(selector);
    const querySelectorAll = (selector) => document.querySelectorAll(selector);

    // --- Constants (Defaults, will be updated from config) ---
    let FALL_ASLEEP_TIME_MINUTES = 15;
    let SLEEP_CYCLE_MINUTES = 90;
    let NUM_CYCLES_SUGGESTIONS = 6;
    let MIN_CYCLES = 3;

    // --- Chart Instance ---
    let remChartInstance = null;

    // --- Interactive Feature State ---
    let adviceAnswers = {};
    let scoreAnswers = {};
    let currentAdviceQuestionIndex = 0;
    let currentScoreQuestionIndex = 0;
    const adviceQuestionsContainer = getElement('advice-questions'); // Get containers once
    const scoreQuestionsContainer = getElement('score-questions');
    let currentSelectedAnswer = null; // Track selected answer for the current question

    // --- Sample Quotes ---
    const sleepQuotes = [
        "Sleep is the golden chain that ties health and our bodies together.",
        "Each night, when I go to sleep, I die. And the next morning, when I wake up, I am reborn.",
        "A well-spent day brings happy sleep.",
        "Sleep is the best meditation.",
        "Man is a genius when he is dreaming.",
        "There is a time for many words, and there is also a time for sleep.",
        "Sleep is the silent healer—let it work its magic.",
        "Recharge your body like your phone—nightly and fully.",
        "Your future depends on your dreams, so go to sleep.",
        "Think in the morning. Act in the noon. Eat in the evening. Sleep in the night."
    ];

    // --- NEW Theme Quotes ---
    const lightModeQuotes = [
        "Let there be light... and productive mornings!",
        "Rise and shine! Ready for a bright day.",
        "Good day sunshine!",
    ];
    const darkModeQuotes = [
        "Embrace the quiet of the night.",
        "Stars can't shine without darkness.",
        "Even the darkest night will end and the sun will rise.",
        "Turn off the light and go to sleep.",
    ];

    // --- Utility Functions ---

    /**
     * Formats total minutes from midnight into hh:mm AM/PM string.
     * @param {number} totalMinutes - Total minutes from midnight.
     * @returns {string} Formatted time string (e.g., "09:30 AM").
     */
    function formatTime(totalMinutes) {
      const hours24 = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;
      const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
      const ampm = hours24 < 12 ? 'AM' : 'PM';
      return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }

    /**
     * Formats a Date object into hh:mm AM/PM string.
     * @param {Date} date - The Date object to format.
     * @returns {string} Formatted time string (e.g., "09:30 AM").
     */
    function formatTimeFromDate(date) {
        if (!(date instanceof Date) || isNaN(date.getTime())) return '--:-- --'; // Added validation
        const hours24 = date.getHours();
        const minutes = date.getMinutes();
        const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
        const ampm = hours24 < 12 ? 'AM' : 'PM';
        return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;
    }


    function parseFormattedTime(timeString) {
        if (!timeString || typeof timeString !== 'string') return null;
        const match = timeString.match(/(\d{1,2}):(\d{2})\s(AM|PM)/i);
        if (match) {
            return { hour: match[1], minute: match[2], ampm: match[3].toUpperCase() };
        }
        // console.warn("Could not parse time string:", timeString); // Removed noisy log
        return null;
    }

    /**
     * Converts time string from Flatpickr input (e.g., "9:30 AM") to total minutes from midnight.
     * @param {string} timeStr - The time string from the Flatpickr input.
     * @returns {number | null} Total minutes from midnight or null if invalid.
     */
    function timeInputToMinutes(timeStr) {
        const parsed = parseFormattedTime(timeStr);
        if (!parsed) return null;
        let hour = parseInt(parsed.hour, 10);
        const minute = parseInt(parsed.minute, 10);
        const ampm = parsed.ampm;

        if (isNaN(hour) || isNaN(minute)) return null;

        if (ampm === 'PM' && hour !== 12) hour += 12;
        else if (ampm === 'AM' && hour === 12) hour = 0; // Midnight case
        return (hour * 60 + minute) % (24 * 60); // Ensure result is within 0-1439
    }

    // --- Theme Toggle ---
    function applyInitialTheme() {
      const savedTheme = localStorage.getItem('theme') || 'light';
      const isDark = savedTheme === 'dark';
      document.body.classList.toggle('dark-mode', isDark);
      document.body.classList.toggle('light-mode', !isDark);

      // Update the NEW theme toggle button and quote
      const themeToggleButtonNew = getElement('theme-toggle-button-new');
      const themeQuoteElement = getElement('theme-quote');

      if (themeToggleButtonNew) {
          themeToggleButtonNew.textContent = isDark ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode';
          themeToggleButtonNew.setAttribute('aria-pressed', isDark.toString());
      }
      if (themeQuoteElement) {
          const quotes = isDark ? darkModeQuotes : lightModeQuotes;
          themeQuoteElement.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
      }

      // Update chart colors if chart exists
      if (remChartInstance) {
          updateChartColors(remChartInstance, isDark);
          remChartInstance.update();
      }
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        document.body.classList.toggle('light-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');

        // Update the NEW theme toggle button and quote
        const themeToggleButtonNew = getElement('theme-toggle-button-new');
        const themeQuoteElement = getElement('theme-quote');

        if (themeToggleButtonNew) {
            themeToggleButtonNew.textContent = isDarkMode ? '☀️ Switch to Light Mode' : '🌙 Switch to Dark Mode';
            themeToggleButtonNew.setAttribute('aria-pressed', isDarkMode.toString());
        }
         if (themeQuoteElement) {
            const quotes = isDarkMode ? darkModeQuotes : lightModeQuotes;
            themeQuoteElement.textContent = `"${quotes[Math.floor(Math.random() * quotes.length)]}"`;
        }

        // Update chart colors if chart exists
        if (remChartInstance) {
            updateChartColors(remChartInstance, isDarkMode);
            remChartInstance.update();
        }
    }


    // --- Tab Switching ---
    function handleTabClick(event) {
      const clickedTab = event.target;
      if (!clickedTab || !clickedTab.classList.contains('tab-button')) return;
      const targetTab = clickedTab.dataset.tab;
      if (!targetTab) return;

      const targetFormId = targetTab === 'wake-up' ? 'wake-up-form' : 'go-to-bed-form';
      const tabButtons = querySelectorAll('#sleep-cycle-calculator .tab-button');
      const calculatorForms = querySelectorAll('#sleep-cycle-calculator .calculator-form');
      const wakeUpResultsDiv = getElement('wake-up-results');
      const goToBedResultsDiv = getElement('go-to-bed-results');
      const sleepNowResultsDiv = getElement('sleep-now-results');

      tabButtons.forEach(button => button.classList.remove('active'));
      clickedTab.classList.add('active');

      calculatorForms.forEach(form => {
        form.classList.toggle('active-form', form.id === targetFormId);
      });

      if (wakeUpResultsDiv) wakeUpResultsDiv.style.display = 'none';
      if (goToBedResultsDiv) goToBedResultsDiv.style.display = 'none';
      if (sleepNowResultsDiv) sleepNowResultsDiv.style.display = 'none';
    }

    // --- Sleep Cycle Calculations ---
    function calculateBedtimes(wakeUpTimeMinutes) {
      const bedtimes = [];
      for (let i = NUM_CYCLES_SUGGESTIONS; i >= MIN_CYCLES; i--) {
        const totalSleepNeeded = i * SLEEP_CYCLE_MINUTES;
        let bedtimeMinutes = (wakeUpTimeMinutes - totalSleepNeeded - FALL_ASLEEP_TIME_MINUTES + 24 * 60) % (24 * 60);
        bedtimes.push({ time: formatTime(bedtimeMinutes), cycles: i });
      }
      return bedtimes.reverse(); // Show earliest bedtime first
    }

    function calculateWakeUpTimes(bedTimeMinutes) {
      const wakeUpTimes = [];
      const fallAsleepTimeMinutes = (bedTimeMinutes + FALL_ASLEEP_TIME_MINUTES) % (24 * 60);
      for (let i = MIN_CYCLES; i <= NUM_CYCLES_SUGGESTIONS; i++) {
        const totalSleepDuration = i * SLEEP_CYCLE_MINUTES;
        let wakeUpTime = (fallAsleepTimeMinutes + totalSleepDuration) % (24 * 60);
        wakeUpTimes.push({ time: formatTime(wakeUpTime), cycles: i });
      }
      return wakeUpTimes;
    }

    // --- REM Cycle Estimation ---
    function estimateRemPhases(bedTimeMinutes, totalSleepHours, age) {
        const fallAsleepTimeMinutes = (bedTimeMinutes + FALL_ASLEEP_TIME_MINUTES) % (24 * 60);
        const totalSleepMinutes = totalSleepHours * 60;
        const wakeUpTimeMinutes = (fallAsleepTimeMinutes + totalSleepMinutes) % (24 * 60);
        const phases = [];
        let currentCycleStart = fallAsleepTimeMinutes;
        const numCycles = Math.floor(totalSleepMinutes / SLEEP_CYCLE_MINUTES);

        for (let i = 1; i <= numCycles; i++) {
            const cycleEnd = (currentCycleStart + SLEEP_CYCLE_MINUTES) % (24 * 60);
            // Simplified REM estimation: starts later and gets longer
            const remDurationApprox = Math.min(30, 10 + (i * 5)); // Cap duration
            const remStartApprox = (cycleEnd - remDurationApprox + 24 * 60) % (24 * 60);
            const remEndApprox = cycleEnd;
            // Simplified light sleep window (first part of cycle)
            const lightSleepStart = currentCycleStart;
            const lightSleepEnd = (currentCycleStart + Math.round(SLEEP_CYCLE_MINUTES * 0.4) + 24*60) % (24 * 60); // Approx 40%

            phases.push({
                cycle: i,
                cycleStart: formatTime(currentCycleStart),
                cycleEnd: formatTime(cycleEnd),
                remStart: formatTime(remStartApprox),
                remEnd: formatTime(remEndApprox),
                lightSleepWindow: `${formatTime(lightSleepStart)} - ${formatTime(lightSleepEnd)}`
            });
            currentCycleStart = cycleEnd;
        }
        return { phases, wakeUpTime: formatTime(wakeUpTimeMinutes) };
    }

    // --- Display Results ---
    function displayBedtimes(targetTime, bedtimes) {
      const targetWakeTimeSpan = getElement('target-wake-time');
      const bedtimeOptionsList = getElement('bedtime-options');
      const wakeUpResultsDiv = getElement('wake-up-results');
      const goToBedResultsDiv = getElement('go-to-bed-results');
      const sleepNowResultsDiv = getElement('sleep-now-results');

      if (!targetWakeTimeSpan || !bedtimeOptionsList || !wakeUpResultsDiv) return;
      targetWakeTimeSpan.textContent = targetTime;
      bedtimeOptionsList.innerHTML = '';
      bedtimes.forEach(bedtime => {
        const timeParts = parseFormattedTime(bedtime.time);
        if (!timeParts) return;
        const li = document.createElement('li');
        li.classList.add('time-result-item');
        li.innerHTML = `
          <span class="time-part hour">${timeParts.hour}</span><span class="time-separator">:</span><span class="time-part minute">${timeParts.minute}</span>
          <span class="time-part ampm">${timeParts.ampm}</span>
          <span class="cycle-count">(${bedtime.cycles} cycles)</span>`;
        bedtimeOptionsList.appendChild(li);
      });
      wakeUpResultsDiv.style.display = 'block';
      if (goToBedResultsDiv) goToBedResultsDiv.style.display = 'none';
      if (sleepNowResultsDiv) sleepNowResultsDiv.style.display = 'none';
    }

    function displayWakeUpTimes(targetTime, wakeUpTimes) {
      const targetBedTimeSpan = getElement('target-bed-time');
      const wakeupOptionsList = getElement('wakeup-options');
      const goToBedResultsDiv = getElement('go-to-bed-results');
      const wakeUpResultsDiv = getElement('wake-up-results');
      const sleepNowResultsDiv = getElement('sleep-now-results');

      if (!targetBedTimeSpan || !wakeupOptionsList || !goToBedResultsDiv) return;
      targetBedTimeSpan.textContent = targetTime;
      wakeupOptionsList.innerHTML = '';
      wakeUpTimes.forEach(wakeUp => {
         const timeParts = parseFormattedTime(wakeUp.time);
         if (!timeParts) return;
         const li = document.createElement('li');
         li.classList.add('time-result-item');
         li.innerHTML = `
           <span class="time-part hour">${timeParts.hour}</span><span class="time-separator">:</span><span class="time-part minute">${timeParts.minute}</span>
           <span class="time-part ampm">${timeParts.ampm}</span>
           <span class="cycle-count">(${wakeUp.cycles} cycles)</span>`;
        wakeupOptionsList.appendChild(li);
      });
      goToBedResultsDiv.style.display = 'block';
      if (wakeUpResultsDiv) wakeUpResultsDiv.style.display = 'none';
      if (sleepNowResultsDiv) sleepNowResultsDiv.style.display = 'none';
    }

    function displaySleepNowResults(currentTimeFormatted, wakeUpTimes) {
        const currentTimeDisplaySpan = getElement('current-time-display');
        const sleepNowWakeupOptionsList = getElement('sleep-now-wakeup-options');
        const sleepNowResultsDiv = getElement('sleep-now-results');
        const wakeUpResultsDiv = getElement('wake-up-results');
        const goToBedResultsDiv = getElement('go-to-bed-results');

        if (!currentTimeDisplaySpan || !sleepNowWakeupOptionsList || !sleepNowResultsDiv) return;

        currentTimeDisplaySpan.textContent = currentTimeFormatted;
        sleepNowWakeupOptionsList.innerHTML = '';

        wakeUpTimes.forEach(wakeUp => {
            const timeParts = parseFormattedTime(wakeUp.time);
            if (!timeParts) return;
            const li = document.createElement('li');
            li.classList.add('time-result-item');
            li.innerHTML = `
              <span class="time-part hour">${timeParts.hour}</span><span class="time-separator">:</span><span class="time-part minute">${timeParts.minute}</span>
              <span class="time-part ampm">${timeParts.ampm}</span>
              <span class="cycle-count">(${wakeUp.cycles} cycles)</span>`;
            sleepNowWakeupOptionsList.appendChild(li);
        });

        sleepNowResultsDiv.style.display = 'block';
        if (wakeUpResultsDiv) wakeUpResultsDiv.style.display = 'none';
        if (goToBedResultsDiv) goToBedResultsDiv.style.display = 'none';
    }

    function displayRemResults(remData) {
        const remPhaseList = getElement('rem-phase-list');
        const remResultsDiv = getElement('rem-results');
        if (!remPhaseList || !remResultsDiv) return;

        remPhaseList.innerHTML = '';
        if (!remData || !remData.phases || remData.phases.length === 0) {
            const li = document.createElement('li');
            li.textContent = "Could not estimate phases. Ensure total sleep duration allows for at least one full cycle.";
            li.style.fontStyle = 'italic';
            remPhaseList.appendChild(li);
            remResultsDiv.style.display = 'block';
            renderRemChart(null);
            return;
        }

        remData.phases.forEach(phase => {
            const li = document.createElement('li');
            li.classList.add('rem-result-item');
            li.innerHTML = `<strong>Cycle ${phase.cycle}:</strong> ${phase.cycleStart} - ${phase.cycleEnd} <br>
                            &nbsp;&nbsp;<em>Est. REM:</em> ${phase.remStart} - ${phase.remEnd} <br>
                            &nbsp;&nbsp;<em>Light Sleep Window:</em> ${phase.lightSleepWindow}`;
            remPhaseList.appendChild(li);
        });

         const wakeLi = document.createElement('li');
         wakeLi.classList.add('rem-result-item', 'final-wake');
         wakeLi.innerHTML = `<strong>Final Wake Up:</strong> ${remData.wakeUpTime}`;
         remPhaseList.appendChild(wakeLi);

        remResultsDiv.style.display = 'block';
        renderRemChart(remData);
    }

    // --- Chart.js Integration ---
    function getChartColors(isDarkMode) {
        return {
            background: isDarkMode ? 'rgba(90, 85, 226, 0.2)' : 'rgba(106, 130, 251, 0.2)',
            border: isDarkMode ? '#5a55e2' : '#6a82fb',
            grid: isDarkMode ? 'rgba(224, 224, 224, 0.2)' : 'rgba(51, 51, 51, 0.1)',
            ticks: isDarkMode ? '#e0e0e0' : '#333',
            pointBg: isDarkMode ? '#fbc2eb' : '#ffafbd',
            deepSleep: isDarkMode ? 'rgba(59, 55, 160, 0.7)' : 'rgba(50, 70, 180, 0.7)',
            lightSleep: isDarkMode ? 'rgba(90, 85, 226, 0.5)' : 'rgba(106, 130, 251, 0.5)',
            remSleep: isDarkMode ? 'rgba(251, 194, 235, 0.7)' : 'rgba(255, 175, 189, 0.7)',
            awake: isDarkMode ? 'rgba(200, 200, 200, 0.5)' : 'rgba(150, 150, 150, 0.5)',
        };
    }

    function updateChartColors(chart, isDarkMode) {
        if (!chart) return;
        const colors = getChartColors(isDarkMode);
        if (chart.data.datasets && chart.data.datasets.length > 0) {
            chart.data.datasets[0].backgroundColor = colors.background;
            chart.data.datasets[0].borderColor = colors.border;
            chart.data.datasets[0].pointBackgroundColor = colors.pointBg;
        }
        if (chart.options.scales) {
            if (chart.options.scales.x) {
                chart.options.scales.x.grid.color = colors.grid;
                chart.options.scales.x.ticks.color = colors.ticks;
            }
            if (chart.options.scales.y) {
                chart.options.scales.y.grid.color = colors.grid;
                chart.options.scales.y.ticks.color = colors.ticks;
            }
        }
    }

    function renderRemChart(remData) {
        const remChartCanvas = getElement('rem-chart');
        if (!remChartCanvas) return;
        const ctx = remChartCanvas.getContext('2d');
        const isDarkMode = document.body.classList.contains('dark-mode');
        const colors = getChartColors(isDarkMode);
        const chartContainer = remChartCanvas.closest('.chart-container');

        if (remChartInstance) {
            remChartInstance.destroy();
            remChartInstance = null;
        }

        if (!remData || !remData.phases || remData.phases.length === 0) {
            remChartCanvas.style.display = 'none';
            if (chartContainer) chartContainer.style.display = 'none';
            return;
        }

        remChartCanvas.style.display = 'block';
        if (chartContainer) chartContainer.style.display = 'block';

        const labels = [];
        const sleepStageData = [];
        const addPoint = (timeStr, stage) => {
            if (timeStr && typeof timeStr === 'string' && timeStr.includes(':')) {
                 labels.push(timeStr);
                 sleepStageData.push(stage);
            } else {
                // console.warn("Skipping invalid time string for chart:", timeStr); // Removed noisy log
            }
        };

        if (remData.phases.length > 0 && remData.phases[0].cycleStart) {
            addPoint(remData.phases[0].cycleStart, 2); // Start Light
        }

        remData.phases.forEach((phase, index) => {
            const cycleStartMinutes = timeInputToMinutes(phase.cycleStart);
            let cycleMidPointApproxTime = null;
            if (cycleStartMinutes !== null) {
                 cycleMidPointApproxTime = formatTime(cycleStartMinutes + Math.round(SLEEP_CYCLE_MINUTES / 3));
            }
            if (cycleMidPointApproxTime) addPoint(cycleMidPointApproxTime, index < 2 ? 1 : 2); // Deep early, Light later
            addPoint(phase.remStart, 2); // Transition to Light before REM
            addPoint(phase.remEnd, 3); // REM phase
            addPoint(phase.cycleEnd, 2); // End cycle in Light
        });

        if (remData.wakeUpTime) addPoint(remData.wakeUpTime, 4); // Awake

        remChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: config?.remCalculator?.chartLabel || 'Estimated Sleep Stage',
                    data: sleepStageData,
                    fill: true,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    borderWidth: 2,
                    pointBackgroundColor: colors.pointBg,
                    tension: 0.3,
                    stepped: false,
                     segment: { borderColor: colors.border, backgroundColor: colors.background }
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: {
                        min: 0.5, max: 4.5,
                        ticks: { color: colors.ticks, stepSize: 1, callback: (v) => ['','Deep','Light','REM','Awake'][Math.round(v)] || '' },
                        grid: { color: colors.grid }
                    },
                    x: { ticks: { color: colors.ticks, maxRotation: 45, minRotation: 0, autoSkip: true, maxTicksLimit: 8 }, grid: { color: colors.grid } }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { title: (i) => i[0].label, label: (c) => `Stage: ${['','Deep Sleep','Light Sleep','REM Sleep','Awake'][Math.round(c.parsed.y)] || 'Unknown'}` } }
                },
                interaction: { intersect: false, mode: 'index' },
            }
        });
    }

    // --- Interactive Features Logic ---

    const adviceQuestionsData = [
        { id: 'bedtime', text: 'What time do you usually go to bed?', options: ['8 PM – 10 PM', '10 PM – 12 AM', 'After 12 AM'] },
        { id: 'latency', text: 'How long does it usually take you to fall asleep?', options: ['Instantly', '15–30 mins', 'Over 30 mins'] },
        { id: 'feeling', text: 'How do you feel upon waking?', options: ['Refreshed', 'Okay', 'Tired/Exhausted'] },
        { id: 'caffeine', text: 'Do you consume caffeine after 6 PM?', options: ['Never', 'Sometimes', 'Often'] },
        { id: 'duration', text: 'How many hours of sleep do you get on average?', options: ['Less than 5 hours', '6–7 hours', '8+ hours'] }
    ];

    const scoreQuestionsData = [
        { id: 'bedtime', text: 'What time do you sleep?', options: { 'Before 10 PM': 20, '10 PM – 12 AM': 15, 'After 12 AM': 5 } },
        { id: 'consistency', text: 'How consistent is your bedtime?', options: { 'Very Consistent': 20, 'Somewhat Consistent': 10, 'Not Consistent': 5 } },
        { id: 'duration', text: 'How many hours do you sleep?', options: { '8+ hours': 20, '6–7 hours': 15, 'Less than 5 hours': 5 } },
        { id: 'screen', text: 'Screen exposure before bed?', options: { 'No screens 1 hour before': 15, 'Minimal screen time': 10, 'High screen usage': 5 } },
        { id: 'feeling', text: 'Do you wake up feeling refreshed?', options: { 'Yes': 10, 'Sometimes': 5, 'No': 2 } },
        { id: 'caffeine', text: 'Caffeine consumption after 6 PM?', options: { 'Never': 10, 'Sometimes': 5, 'Regularly': 2 } }
    ];

    // Creates HTML for a SINGLE question including the Next button
    function createQuestionHTML(questionData, featurePrefix, questionIndex, totalQuestions) {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'question-group';
        groupDiv.dataset.index = questionIndex; // Store index for reference
        groupDiv.dataset.feature = featurePrefix; // Store feature type
        groupDiv.dataset.questionId = questionData.id; // Store question ID

        groupDiv.innerHTML = `<label class="question-text">${questionData.text}</label>`;
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'question-options';

        const options = Array.isArray(questionData.options) ? questionData.options : Object.keys(questionData.options);

        options.forEach((optionText, index) => {
            const optionId = `${featurePrefix}-${questionData.id}-${index}`;
            const label = document.createElement('label');
            label.className = 'option-button'; // Class for button styling
            label.setAttribute('for', optionId);

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `${featurePrefix}-${questionData.id}`; // Group radios for the same question
            radio.id = optionId;
            radio.value = optionText;
            radio.required = true;
            // Add event listener to enable Next button on change
            radio.addEventListener('change', (e) => handleAnswerChange(featurePrefix, questionData.id, e.target.value));

            label.appendChild(radio);
            label.appendChild(document.createTextNode(` ${optionText}`)); // Add space before text
            optionsDiv.appendChild(label);
        });

        groupDiv.appendChild(optionsDiv);

        // Add Next/Submit button
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'question-actions';
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.className = 'admin-button next-question-btn';
        nextButton.textContent = (questionIndex < totalQuestions - 1) ? 'Next Question' : 'Show Results';
        nextButton.disabled = true; // Initially disabled
        buttonContainer.appendChild(nextButton);
        groupDiv.appendChild(buttonContainer);

        return groupDiv;
    }

    // Displays a specific question with animation
    function displayQuestion(featurePrefix, index) {
        const questionsData = featurePrefix === 'advice' ? adviceQuestionsData : scoreQuestionsData;
        const container = featurePrefix === 'advice' ? adviceQuestionsContainer : scoreQuestionsContainer;

        if (!container || index >= questionsData.length) {
            console.error("Container not found or index out of bounds");
            return; // Should not happen if logic is correct
        }

        currentSelectedAnswer = null; // Reset selected answer for the new question

        const questionData = questionsData[index];
        const questionElement = createQuestionHTML(questionData, featurePrefix, index, questionsData.length);

        // Clear previous question and add new one
        container.innerHTML = '';
        container.appendChild(questionElement);

        // Add enter animation class
        questionElement.classList.add('question-enter');
        // Optional: Remove class after animation completes to allow re-triggering if needed
        questionElement.addEventListener('animationend', () => {
            questionElement.classList.remove('question-enter');
        }, { once: true });

        container.style.display = 'block'; // Ensure container is visible
    }

    // Handles answer selection - ONLY enables the Next button
    function handleAnswerChange(featurePrefix, questionId, value) {
        currentSelectedAnswer = value; // Store the currently selected value temporarily
        const container = featurePrefix === 'advice' ? adviceQuestionsContainer : scoreQuestionsContainer;
        const nextButton = container.querySelector('.next-question-btn');
        if (nextButton) {
            nextButton.disabled = false; // Enable the button
        }
    }

    // Handles click on the "Next Question" or "Show Results" button
    function handleNextQuestionClick(event) {
        if (!event.target.classList.contains('next-question-btn')) return;

        const button = event.target;
        const questionGroup = button.closest('.question-group');
        if (!questionGroup) return;

        const featurePrefix = questionGroup.dataset.feature;
        const questionId = questionGroup.dataset.questionId;
        const questionsData = featurePrefix === 'advice' ? adviceQuestionsData : scoreQuestionsData;
        const container = featurePrefix === 'advice' ? adviceQuestionsContainer : scoreQuestionsContainer;
        let currentIndex = featurePrefix === 'advice' ? currentAdviceQuestionIndex : currentScoreQuestionIndex;

        // Ensure an answer was selected and stored temporarily
        if (currentSelectedAnswer === null) {
            // Optionally show a message to select an answer
            // console.warn("No answer selected for question:", questionId); // Removed noisy log
            return;
        }

        // Store the answer permanently
        if (featurePrefix === 'advice') {
            adviceAnswers[questionId] = currentSelectedAnswer;
            // console.log("Advice Answers:", adviceAnswers); // Removed noisy log
        } else {
            scoreAnswers[questionId] = currentSelectedAnswer;
            // console.log("Score Answers:", scoreAnswers); // Removed noisy log
        }

        // Apply exit animation to the current question
        questionGroup.classList.add('question-exit');

        // Wait for exit animation to finish before showing next question or results
        questionGroup.addEventListener('animationend', () => {
            currentIndex++; // Move to the next index

            if (currentIndex < questionsData.length) {
                // Update the global index tracker
                if (featurePrefix === 'advice') {
                    currentAdviceQuestionIndex = currentIndex;
                } else {
                    currentScoreQuestionIndex = currentIndex;
                }
                // Display the next question
                displayQuestion(featurePrefix, currentIndex);
            } else {
                // All questions answered, display results
                container.style.display = 'none'; // Hide question area
                if (featurePrefix === 'advice') {
                    // --- NEW: Generate and display the full report ---
                    generateAndDisplayFullReport();
                    getElement('advice-results').style.display = 'block';
                } else {
                    displaySleepScore(); // Uses scoreAnswers
                    getElement('score-results').style.display = 'block';
                }
                // Optionally re-enable the start button
                const startBtn = querySelector(featurePrefix === 'advice' ? '.start-advice-btn' : '.start-score-btn');
                if (startBtn) startBtn.style.display = 'inline-block';
            }
        }, { once: true }); // Use { once: true } to automatically remove the listener
    }


    // --- Result Display Functions (Use stored answers) ---

    // --- NEW: Full Report Generation and Display ---

    // Helper: Generate Analysis HTML (Simulates AI)
    function generateAnalysisHTML(answers) {
        let analysisText = "Based on your inputs, ";
        let issues = [];

        // Duration
        if (answers.duration === 'Less than 5 hours') {
            analysisText += "your current sleep duration of less than 5 hours per night is significantly below the recommended 7–9 hours for optimal health and cognitive function. This is a major area for improvement. ";
            issues.push("short sleep duration");
        } else if (answers.duration === '6–7 hours') {
            analysisText += "your sleep duration of 6–7 hours per night is slightly below the recommended 7–9 hours. While manageable for some, it might contribute to feeling less than fully refreshed. ";
            issues.push("potentially insufficient sleep duration");
        } else {
            analysisText += "your sleep duration of 8+ hours seems adequate, which is a great foundation. ";
        }

        // Latency
        if (answers.latency === 'Over 30 mins') {
            analysisText += "Falling asleep takes you more than 30 minutes, which often indicates pre-bedtime overstimulation, stress, or inconsistent sleep timing. ";
            issues.push("long sleep latency");
        } else if (answers.latency === 'Instantly') {
            analysisText += "Falling asleep instantly might sometimes suggest excessive tiredness or accumulated sleep debt, despite adequate duration on some nights. ";
            issues.push("very short sleep latency (potential overtiredness)");
        } else {
            analysisText += "Falling asleep within 15–30 minutes is generally considered healthy. ";
        }

        // Feeling on Waking
        if (answers.feeling === 'Tired/Exhausted') {
            analysisText += "You’ve reported waking up feeling tired or exhausted, a clear sign that your sleep quality or quantity (or both) needs attention, possibly due to interrupted cycles or insufficient deep/REM sleep. ";
            issues.push("poor subjective sleep quality");
        } else if (answers.feeling === 'Okay') {
            analysisText += "Waking up feeling just 'Okay' suggests there's room to improve sleep quality or consistency for better morning energy. ";
            issues.push("mediocre subjective sleep quality");
        } else {
            analysisText += "Waking up refreshed is excellent and indicates good sleep quality and timing. ";
        }

        // Caffeine
        if (answers.caffeine === 'Often' || answers.caffeine === 'Sometimes') {
            analysisText += `Consuming caffeine ${answers.caffeine.toLowerCase()} after 6 PM can significantly interfere with falling asleep and reduce deep sleep quality, even if you don't feel jittery. `;
            issues.push("late caffeine consumption");
        }

        // Bedtime
        if (answers.bedtime === 'After 12 AM') {
            analysisText += "Going to bed after midnight can disrupt your natural circadian rhythm, potentially impacting hormone regulation and overall sleep architecture. ";
            issues.push("late bedtime");
        } else if (answers.bedtime === '10 PM – 12 AM') {
             analysisText += "A bedtime between 10 PM and 12 AM is common, but ensure it allows for your target sleep duration before your required wake-up time. ";
        } else {
             analysisText += "A bedtime between 8 PM and 10 PM aligns well with natural circadian rhythms for many people. ";
        }

        if (issues.length > 0) {
            analysisText += `Key areas identified for improvement include: ${issues.join(', ')}. `;
        } else if (answers.feeling !== 'Refreshed') {
             analysisText += "While major issues aren't apparent, focusing on consistency and optimizing your sleep environment could enhance how refreshed you feel. ";
        } else {
             analysisText += "Your sleep habits appear generally healthy based on these inputs. Maintaining consistency is key. ";
        }

         analysisText += "By addressing these areas with small, consistent changes, you can significantly upgrade your energy levels, mood, cognitive function, and overall well-being.";

        // Basic word count simulation (adjust multiplier as needed)
        // const wordCount = analysisText.split(' ').length;
        // console.log(`Generated Analysis Word Count (approx): ${wordCount}`); // Removed noisy log


        return `<div class="sleep-report-section sleep-report-analysis">
                    <h6><span class="icon">📊</span> Personalized Sleep Analysis</h6>
                    <p>${analysisText}</p>
                </div>`;
    }

    // Helper: Generate Suggestions HTML (Simulates AI)
    function generateSuggestionsHTML(answers) {
        let suggestionsList = [];

        // General suggestion
        suggestionsList.push("<strong>Stick to a consistent bedtime and wake-up time</strong>, even on weekends, to regulate your body's internal clock.");

        // Based on Latency
        if (answers.latency === 'Over 30 mins') {
            suggestionsList.push("<strong>Create a relaxing wind-down routine</strong> for 30-60 minutes before bed. Avoid screens, try reading a physical book, light stretching, or taking a warm bath.");
            suggestionsList.push("Evaluate your sleep environment: ensure it's <strong>dark, quiet, and cool</strong> (around 18-20°C or 65-68°F).");
        }

         // Based on Duration & Feeling
        if (answers.duration !== '8+ hours' || answers.feeling !== 'Refreshed') {
             suggestionsList.push(`Gradually <strong>increase your sleep duration</strong>. Aim for 7-9 hours. Try going to bed 15-30 minutes earlier each week until you feel consistently refreshed.`);
        }
         if (answers.feeling !== 'Refreshed') {
             suggestionsList.push(`Use a <a href="/"><strong>Sleep Cycle Calculator</strong></a> to align your wake-up time with the end of a sleep cycle, minimizing grogginess.`);
         }

        // Based on Caffeine
        if (answers.caffeine === 'Often' || answers.caffeine === 'Sometimes') {
            suggestionsList.push("<strong>Avoid caffeine at least 6-8 hours before bedtime</strong>. Switch to decaf or herbal teas like chamomile in the afternoon/evening.");
        }

        // Based on Bedtime
        if (answers.bedtime === 'After 12 AM') {
            suggestionsList.push("Consider <strong>gradually shifting your bedtime earlier</strong> by 15 minutes every few days to better align with natural light cycles.");
        }

        // General good habits
        suggestionsList.push("<strong>Get natural sunlight exposure</strong> in the morning to help set your circadian rhythm.");
        suggestionsList.push("<strong>Exercise regularly</strong>, but avoid intense workouts close to bedtime.");
        suggestionsList.push("<strong>Avoid large meals and excessive fluids</strong> right before sleeping.");
        suggestionsList.push("If sleep problems persist, consider consulting a healthcare professional.");


        const suggestionsHTML = suggestionsList.map(item => `<li>${item}</li>`).join('');

         // Basic word count simulation
        // const wordCount = suggestionsHTML.replace(/<[^>]*>/g, ' ').split(' ').length;
        // console.log(`Generated Suggestions Word Count (approx): ${wordCount}`); // Removed noisy log

        return `<div class="sleep-report-section sleep-report-suggestions">
                    <h6><span class="icon">💡</span> Tailored Suggestions</h6>
                    <ul>${suggestionsHTML}</ul>
                </div>`;
    }

    // Helper: Calculate Sleep Score (Simulates AI logic based on advice answers)
    function calculateSleepScore(answers) {
        let score = 100; // Start with a perfect score

        // Deductions based on answers
        switch (answers.duration) {
            case 'Less than 5 hours': score -= 35; break;
            case '6–7 hours': score -= 20; break;
            default: score -= 0; // 8+ hours is good
        }

        switch (answers.latency) {
            case 'Over 30 mins': score -= 20; break;
            case 'Instantly': score -= 5; break; // Minor deduction for potential overtiredness
            default: score -= 0; // 15-30 mins is good
        }

        switch (answers.feeling) {
            case 'Tired/Exhausted': score -= 25; break;
            case 'Okay': score -= 10; break;
            default: score -= 0; // Refreshed is good
        }

        switch (answers.caffeine) {
            case 'Often': score -= 15; break;
            case 'Sometimes': score -= 8; break;
            default: score -= 0; // Never is good
        }

         switch (answers.bedtime) {
            case 'After 12 AM': score -= 10; break;
            case '10 PM – 12 AM': score -= 5; break; // Slight deduction if it pushes duration short
            default: score -= 0; // 8-10 PM generally aligns well
        }

        // Ensure score is within 0-100 range
        return Math.max(0, Math.min(100, score));
    }

    // Helper: Generate Score HTML
    function generateScoreHTML(score) {
        let interpretation = '';
        let icon = '';
        if (score >= 85) { interpretation = "Excellent – Great routine, minimal risk."; icon = '🏆'; }
        else if (score >= 65) { interpretation = "Good – Solid habits, but room for optimization."; icon = '👍'; }
        else if (score >= 40) { interpretation = "Needs Attention – Inconsistent patterns impacting quality."; icon = '🤔'; }
        else { interpretation = "Poor – Needs significant changes for better health."; icon = '⚠️'; }

        return `<div class="sleep-report-section sleep-report-score">
                    <h6><span class="icon">🧪</span> Your Sleep Health Score</h6>
                    <div class="score-display-report"> <!-- Use a different class if needed -->
                        <span class="score-value">${score}/100</span>
                        <p class="score-interpretation"><span class="icon" role="img" aria-label="${icon}">${icon}</span> ${interpretation}</p>
                    </div>
                </div>`;
    }

    // Helper: Get Random Quote
    function getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * sleepQuotes.length);
        return sleepQuotes[randomIndex];
    }

    // Helper: Generate Quote HTML
    function generateQuoteHTML(quote) {
        return `<div class="sleep-report-section sleep-report-quote">
                    <h6><span class="icon">🌙</span> Quote to Inspire You</h6>
                    <p><em>"${quote}"</em></p>
                </div>`;
    }


    // Main function to generate and display the full report
    function generateAndDisplayFullReport() {
        const resultsContainer = getElement('advice-results');
        if (!resultsContainer) return;

        // Show loading state
        resultsContainer.innerHTML = '<p class="loading-indicator">Generating your personalized sleep report...</p>';
        resultsContainer.style.display = 'block'; // Ensure it's visible

        // Simulate AI processing delay (optional)
        setTimeout(() => {
            // Generate each section
            const analysisHTML = generateAnalysisHTML(adviceAnswers);
            const suggestionsHTML = generateSuggestionsHTML(adviceAnswers);
            const score = calculateSleepScore(adviceAnswers);
            const scoreHTML = generateScoreHTML(score);
            const quote = getRandomQuote();
            const quoteHTML = generateQuoteHTML(quote);

            // Combine sections into the final report HTML
            const fullReportHTML = `
                <h5><span class="icon">🛌</span> Personalized Sleep Report for You</h5>
                ${analysisHTML}
                ${suggestionsHTML}
                ${scoreHTML}
                ${quoteHTML}
            `;

            // Display the report
            resultsContainer.innerHTML = fullReportHTML;
            resultsContainer.classList.add('results-enter'); // Add animation class

            // Reset animation class after it finishes
            resultsContainer.addEventListener('animationend', () => {
                resultsContainer.classList.remove('results-enter');
            }, { once: true });

        }, 500); // 0.5 second delay simulation
    }


    // --- OLD Simple Advice Display (Now replaced by generateAndDisplayFullReport) ---
    /*
    function displayPersonalizedAdvice() {
        // ... (previous implementation is now obsolete) ...
    }
    */

    // --- Sleep Score Display (for the separate Sleep Score feature) ---
    function displaySleepScore() {
        const scoreTextValue = getElement('score-text-value');
        const scoreCircle = getElement('score-circle');
        const scoreInsightsText = getElement('score-insights-text');
        const resultsContainer = getElement('score-results');
        if (!scoreTextValue || !scoreCircle || !scoreInsightsText || !resultsContainer) return;

        let totalScore = 0;
        // Logic uses the globally stored scoreAnswers object
        scoreQuestionsData.forEach(q => {
            const answer = scoreAnswers[q.id]; // Get stored answer
            if (answer && q.options[answer]) {
                totalScore += q.options[answer];
            }
        });

        totalScore = Math.max(0, Math.min(100, totalScore));

        // Update score text and circle animation
        scoreTextValue.textContent = totalScore;
        const circumference = 2 * Math.PI * 15.9155; // Radius of circle in SVG (cx/cy - stroke-width/2) = 18 - 2.0845/2 approx 15.9
        const offset = circumference - (totalScore / 100) * circumference;
        // Ensure the transition property is set in CSS for the animation effect
        scoreCircle.style.strokeDasharray = `${circumference}`; // Set total length first
        // Use timeout to allow browser to render the initial state before transitioning
        setTimeout(() => {
            scoreCircle.style.strokeDashoffset = offset;
        }, 100); // Small delay

        // Determine insights based on score
        let insights = ''; let icon = '';
        if (totalScore >= 80) { insights = "<strong>Excellent sleep hygiene!</strong> Maintain your healthy habits."; icon = '🏆'; }
        else if (totalScore >= 60) { insights = "<strong>You're doing okay.</strong> Focus on improving screen discipline before bed and maintaining a consistent sleep schedule."; icon = '👍'; }
        else if (totalScore >= 40) { insights = "<strong>Needs Improvement.</strong> Try increasing your sleep duration and reducing evening caffeine intake."; icon = '🤔'; }
        else { insights = "<strong>Potential Risk.</strong> Your sleep habits may be impacting your health. Consider making significant lifestyle changes and consult a professional if needed."; icon = '⚠️'; }

        scoreInsightsText.innerHTML = `<p><span class="icon" role="img" aria-label="${icon}">${icon}</span> ${insights}</p>`;

        resultsContainer.classList.add('results-enter'); // Add animation class
    }


    // --- Event Listeners ---

    function addEventListeners() {
        const tabsContainer = querySelector('#sleep-cycle-calculator .tabs');
        const wakeUpForm = getElement('wake-up-form');
        const goToBedForm = getElement('go-to-bed-form');
        const remForm = getElement('rem-form');
        const sleepNowButton = getElement('sleep-now-button');
        const themeToggleButtonNew = getElement('theme-toggle-button-new'); // Get the NEW button

        // Interactive Feature Buttons
        const startAdviceBtn = querySelector('.start-advice-btn');
        const startScoreBtn = querySelector('.start-score-btn');

        if (tabsContainer) tabsContainer.addEventListener('click', handleTabClick);

        // Add listener for the new theme toggle button
        if (themeToggleButtonNew) {
            themeToggleButtonNew.addEventListener('click', toggleTheme);
        }

        document.body.addEventListener('click', (e) => {
            if (e.target.classList.contains('sleep-now-button') && e.target.dataset.target) {
                const targetInputId = e.target.dataset.target;
                const targetInput = getElement(targetInputId);
                if (targetInput && targetInput._flatpickr) {
                    targetInput._flatpickr.setDate(new Date(), true);
                } else {
                    // console.warn(`Target input #${targetInputId} not found or not a flatpickr instance.`); // Removed noisy log
                }
            }
        });

        if (wakeUpForm) wakeUpForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const wakeUpTimeInput = getElement('wake-up-time-input');
          if (!wakeUpTimeInput || !wakeUpTimeInput.value) { alert("Please select a wake-up time."); return; }
          const wakeUpTimeMinutes = timeInputToMinutes(wakeUpTimeInput.value);
          if (wakeUpTimeMinutes === null) { alert("Invalid wake-up time selected."); return; }
          displayBedtimes(wakeUpTimeInput.value, calculateBedtimes(wakeUpTimeMinutes));
        });

        if (goToBedForm) goToBedForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const bedTimeInput = getElement('bed-time-input');
           if (!bedTimeInput || !bedTimeInput.value) { alert("Please select a bedtime."); return; }
          const bedTimeMinutes = timeInputToMinutes(bedTimeInput.value);
           if (bedTimeMinutes === null) { alert("Invalid bedtime selected."); return; }
          displayWakeUpTimes(bedTimeInput.value, calculateWakeUpTimes(bedTimeMinutes));
        });

        if (sleepNowButton) {
            sleepNowButton.addEventListener('click', () => {
                const now = new Date();
                const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
                displaySleepNowResults(formatTimeFromDate(now), calculateWakeUpTimes(currentTimeMinutes));
            });
        }

        if (remForm) remForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const remBedTimeInput = getElement('rem-bed-time-input');
            if (!remBedTimeInput || !remBedTimeInput.value) { alert("Please select a bedtime for REM calculation."); return; }
            const bedTimeMinutes = timeInputToMinutes(remBedTimeInput.value);
            if (bedTimeMinutes === null) { alert("Invalid bedtime selected for REM calculation."); return; }
            const totalSleepHoursInput = getElement('total-sleep-hours');
            const totalSleepHours = parseFloat(totalSleepHoursInput.value);
            const ageInput = getElement('user-age');
            const age = ageInput?.value ? parseInt(ageInput.value, 10) : null;
            if (isNaN(totalSleepHours) || totalSleepHours <= 0 || totalSleepHours > 24) {
                alert(config?.remCalculator?.invalidDurationMessage || "Please enter a valid number of sleep hours (e.g., 1-16).");
                if (totalSleepHoursInput) { totalSleepHoursInput.focus(); totalSleepHoursInput.select(); }
                const remPhaseList = getElement('rem-phase-list'); const remResultsDiv = getElement('rem-results');
                if(remPhaseList) remPhaseList.innerHTML = '<li>Invalid input for sleep duration.</li>';
                if(remResultsDiv) remResultsDiv.style.display = 'block';
                renderRemChart(null); return;
            }
            displayRemResults(estimateRemPhases(bedTimeMinutes, totalSleepHours, age));
        });

        // --- Interactive Feature Listeners ---
        if (startAdviceBtn && adviceQuestionsContainer) {
            startAdviceBtn.addEventListener('click', () => {
                adviceAnswers = {}; // Reset answers
                currentAdviceQuestionIndex = 0; // Reset index
                getElement('advice-results').style.display = 'none'; // Hide results
                getElement('advice-results').classList.remove('results-enter'); // Reset animation class
                startAdviceBtn.style.display = 'none'; // Hide start button
                displayQuestion('advice', 0); // Display the first question
            });
        }

        if (startScoreBtn && scoreQuestionsContainer) {
            startScoreBtn.addEventListener('click', () => {
                scoreAnswers = {}; // Reset answers
                currentScoreQuestionIndex = 0; // Reset index
                getElement('score-results').style.display = 'none'; // Hide results
                getElement('score-results').classList.remove('results-enter'); // Reset animation class
                startScoreBtn.style.display = 'none'; // Hide start button
                displayQuestion('score', 0); // Display the first question
            });
        }

        // Add delegated event listener for the "Next" buttons inside the question containers
        if (adviceQuestionsContainer) {
            adviceQuestionsContainer.addEventListener('click', handleNextQuestionClick);
        }
        if (scoreQuestionsContainer) {
            scoreQuestionsContainer.addEventListener('click', handleNextQuestionClick);
        }
    }

    // --- Update UI with Config ---
    function updateUIFromConfig() {
        if (!config) { console.warn("Config not loaded, cannot update UI."); return; }
        const setText = (s, t) => { const e = querySelector(s); if (e) e.textContent = t || ''; };
        const setNodeText = (s, i, t) => { const e = querySelector(s); if (e && e.childNodes[i]) e.childNodes[i].nodeValue = t || ''; };
        const setAttr = (s, a, v) => { const e = querySelector(s); if (e) e.setAttribute(a, v || ''); };
        const setDisplay = (s, v) => { const e = getElement(s.substring(1)); if (e) e.style.display = v ? 'block' : 'none'; };

        document.title = config.siteTitle || 'SleepCycleREMCalculator'; // Use updated name
        setAttr('meta[name="description"]', 'content', config.description);

        if (config.sleepCycleCalculator) {
            setNodeText('#sleep-cycle-calculator h2', 1, ` ${config.sleepCycleCalculator.title}`);
            setText('#sleep-cycle-calculator > p', config.sleepCycleCalculator.description);
            setText('.tab-button[data-tab="wake-up"]', config.sleepCycleCalculator.wakeUpTab);
            setText('.tab-button[data-tab="go-to-bed"]', config.sleepCycleCalculator.goToBedTab);
            setText('#wake-up-form label', config.sleepCycleCalculator.wakeUpLabel);
            setText('#go-to-bed-form label', config.sleepCycleCalculator.bedTimeLabel);
            setText('#wake-up-form .calculate-button', config.sleepCycleCalculator.calculateBedtimesButton);
            setText('#go-to-bed-form .calculate-button', config.sleepCycleCalculator.calculateWakeUpTimesButton);
            const wakeUpP = querySelector('#wake-up-results p:first-of-type');
            if (wakeUpP && wakeUpP.childNodes.length > 1) { wakeUpP.childNodes[0].nodeValue = `${config.sleepCycleCalculator.wakeUpResultPrefix || 'If you want to wake up at'} `; wakeUpP.childNodes[2].nodeValue = ` ${config.sleepCycleCalculator.wakeUpResultSuffix || ', you should aim to fall asleep at one of these times:'}`; }
            const goToBedP = querySelector('#go-to-bed-results p:first-of-type');
             if (goToBedP && goToBedP.childNodes.length > 1) { goToBedP.childNodes[0].nodeValue = `${config.sleepCycleCalculator.goToBedResultPrefix || 'If you go to bed at'} `; goToBedP.childNodes[2].nodeValue = ` ${config.sleepCycleCalculator.goToBedResultSuffix || ', you should aim to wake up at one of these times for optimal rest:'}`; }
            setText('#wake-up-results .note', config.sleepCycleCalculator.fallAsleepNote);
            setText('#go-to-bed-results .note', config.sleepCycleCalculator.wakeUpNote);
            setText('#sleep-now-results .note', config.sleepCycleCalculator.wakeUpNote);
        }

        if (config.remCalculator) {
            setDisplay('#rem-calculator', config.remCalculator.visible);
            if (config.remCalculator.visible) {
                setNodeText('#rem-calculator h2', 1, ` ${config.remCalculator.title}`);
                setText('#rem-calculator > p', config.remCalculator.description);
                setText('#rem-form label[for="rem-bed-time-input"]', config.remCalculator.bedTimeLabel);
                setText('#rem-form label[for="total-sleep-hours"]', config.remCalculator.sleepDurationLabel);
                setText('#sleep-hours-desc', config.remCalculator.sleepDurationDescription);
                setText('#rem-form label[for="user-age"]', config.remCalculator.ageLabel);
                setText('#age-desc', config.remCalculator.ageDescription);
                setText('#rem-form .calculate-button', config.remCalculator.calculateButton);
                setText('#rem-results p:first-of-type', config.remCalculator.resultsTitle);
            }
        }

        if (config.sleepCycleCalculator) {
            FALL_ASLEEP_TIME_MINUTES = config.sleepCycleCalculator.fallAsleepTimeMinutes ?? 15;
            SLEEP_CYCLE_MINUTES = config.sleepCycleCalculator.sleepCycleMinutes ?? 90;
            NUM_CYCLES_SUGGESTIONS = config.sleepCycleCalculator.numCycleSuggestions ?? 6;
            MIN_CYCLES = config.sleepCycleCalculator.minCycles ?? 3;
        }
    }

    // --- Fetch Config ---
    async function fetchConfig() {
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                 if (response.status === 404) { console.log('Config file not found, using default empty object.'); config = {}; }
                 else { throw new Error(`HTTP error! status: ${response.status}`); }
            } else { config = await response.json(); /* console.log('Config loaded:', config); */ } // Removed noisy log
            updateUIFromConfig();
            addEventListeners(); // Add listeners AFTER config is potentially loaded
        } catch (error) {
            console.error("Could not fetch config. Using default values.", error);
            config = {};
            updateUIFromConfig();
            addEventListeners(); // Still add listeners even if config fails
        }
    }

    // --- Initialize Flatpickr ---
    function initializeFlatpickr() {
        const commonOptions = { enableTime: true, noCalendar: true, dateFormat: "h:i K", time_24hr: false, minuteIncrement: 15 };
        flatpickr("#wake-up-time-input", commonOptions);
        flatpickr("#bed-time-input", commonOptions);
        flatpickr("#rem-bed-time-input", commonOptions);
        // console.log("Flatpickr initialized with 15-minute increments."); // Removed noisy log
    }

    // --- Initialization ---
    function init() {
      applyInitialTheme(); // Apply theme first
      initializeFlatpickr();

      const defaultTab = querySelector('#sleep-cycle-calculator .tab-button[data-tab="wake-up"]');
      if (defaultTab) {
          defaultTab.classList.add('active');
          const defaultForm = getElement('wake-up-form');
          if (defaultForm) defaultForm.classList.add('active-form');
      }

      // Hide result sections initially
      const resultSections = ['wake-up-results', 'go-to-bed-results', 'rem-results', 'sleep-now-results', 'advice-results', 'score-results'];
      resultSections.forEach(id => {
          const el = getElement(id);
          if (el) el.style.display = 'none';
      });

      const remChartCanvas = getElement('rem-chart');
      if (remChartCanvas) {
          const chartContainer = remChartCanvas.closest('.chart-container');
          if (chartContainer) chartContainer.style.display = 'none';
          remChartCanvas.style.display = 'none';
      }

      // Ensure interactive feature question areas are hidden initially
      if (adviceQuestionsContainer) adviceQuestionsContainer.style.display = 'none';
      if (scoreQuestionsContainer) scoreQuestionsContainer.style.display = 'none';

      fetchConfig(); // Fetch config and add listeners after fetch completes
    }

    // --- Run Initialization ---
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
