/**
 * ¡Salud! Language Learning Platform - Main JavaScript
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Make sure Bootstrap is loaded
    if (typeof bootstrap !== 'undefined') {
        try {
            // Initialize tooltips
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function(tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });

            // Initialize popovers
            const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
            popoverTriggerList.map(function(popoverTriggerEl) {
                return new bootstrap.Popover(popoverTriggerEl);
            });
        } catch (error) {
            console.error('Error initializing Bootstrap components:', error);
        }
    } else {
        console.warn('Bootstrap JavaScript is not loaded. Some features may not work properly.');
    }
    
    // Initialize theme toggle
    setupThemeToggle();
    
    // Initialize amber filter
    setupAmberFilter();
    
    // Add console log to check if the script is running
    console.log('¡Salud! JavaScript initialized');

    // API Endpoints
    const API_ENDPOINTS = {
        GENERATE_LESSON: '/api/interactive_lesson',
        SUBJECT_LESSON: '/api/subject_lesson',
        JOURNAL: '/api/journal',
        WRITING_EXERCISE: '/api/writing_exercise',
        CHECK_WRITING: '/api/check_writing',
        TYPING_EXERCISE: '/api/typing_exercise',
        IMMERSION_CONTENT: '/api/immersion_content',
        CULTURAL_CONTENT: '/api/cultural_content',
        IMPORT_CONTENT: '/api/import_content',
        PROCESS_YOUTUBE: '/api/process_youtube'
    };

    // Form Submission Handlers
    setupFormHandlers();

    // Setup Language Switcher
    setupLanguageSwitcher();

    // Setup Typing Exercise (if on typing page)
    if (document.getElementById('typing-exercise')) {
        setupTypingExercise();
    }

    // Setup Journal Editor (if on journal page)
    if (document.getElementById('journal-editor')) {
        setupJournalEditor();
    }

    // Setup Lesson Generator (if on lessons page)
    if (document.getElementById('lesson-generator-form')) {
        setupLessonGenerator();
    }

    // Setup Writing Exercise (if on writing page)
    if (document.getElementById('writing-exercise-form')) {
        setupWritingExercise();
    }

    // Setup YouTube Processor (if on YouTube page)
    if (document.getElementById('youtube-processor-form')) {
        setupYouTubeProcessor();
    }
});

/**
 * Setup form submission handlers
 */
function setupFormHandlers() {
    // Get all forms with class 'api-form'
    const forms = document.querySelectorAll('.api-form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const formId = this.id;
            const formData = new FormData(this);
            const jsonData = {};
            
            // Convert FormData to JSON
            for (const [key, value] of formData.entries()) {
                jsonData[key] = value;
            }
            
            // Determine which API endpoint to use based on form ID
            let endpoint = '';
            let method = 'POST';
            
            switch (formId) {
                case 'lesson-generator-form':
                    endpoint = API_ENDPOINTS.GENERATE_LESSON;
                    break;
                case 'subject-lesson-form':
                    endpoint = API_ENDPOINTS.SUBJECT_LESSON;
                    break;
                case 'journal-form':
                    endpoint = API_ENDPOINTS.JOURNAL;
                    break;
                case 'writing-exercise-form':
                    endpoint = API_ENDPOINTS.WRITING_EXERCISE;
                    break;
                case 'writing-check-form':
                    endpoint = API_ENDPOINTS.CHECK_WRITING;
                    break;
                case 'immersion-content-form':
                    endpoint = API_ENDPOINTS.IMMERSION_CONTENT;
                    method = 'GET';
                    break;
                case 'cultural-content-form':
                    endpoint = API_ENDPOINTS.CULTURAL_CONTENT;
                    method = 'GET';
                    break;
                case 'import-content-form':
                    endpoint = API_ENDPOINTS.IMPORT_CONTENT;
                    break;
                case 'youtube-processor-form':
                    endpoint = API_ENDPOINTS.PROCESS_YOUTUBE;
                    break;
                default:
                    console.error('Unknown form ID:', formId);
                    return;
            }
            
            // Show loading indicator
            const resultContainer = document.getElementById(`${formId}-result`);
            if (resultContainer) {
                resultContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Processing your request...</p></div>';
            }
            
            // Make API request
            if (method === 'GET') {
                // For GET requests, build query string
                const queryParams = new URLSearchParams();
                for (const key in jsonData) {
                    queryParams.append(key, jsonData[key]);
                }
                
                fetch(`${endpoint}?${queryParams.toString()}`)
                    .then(response => response.json())
                    .then(data => handleApiResponse(data, formId))
                    .catch(error => handleApiError(error, formId));
            } else {
                // For POST requests
                fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(jsonData)
                })
                    .then(response => response.json())
                    .then(data => handleApiResponse(data, formId))
                    .catch(error => handleApiError(error, formId));
            }
        });
    });
}

/**
 * Handle API response
 */
function handleApiResponse(data, formId) {
    const resultContainer = document.getElementById(`${formId}-result`);
    
    if (!resultContainer) {
        console.error('Result container not found for form:', formId);
        return;
    }
    
    if (!data.success) {
        resultContainer.innerHTML = `<div class="alert alert-danger">${data.message || 'An error occurred'}</div>`;
        return;
    }
    
    // Handle different types of responses based on form ID
    switch (formId) {
        case 'lesson-generator-form':
        case 'subject-lesson-form':
            displayLesson(data.lesson, resultContainer);
            break;
        case 'journal-form':
            displayJournalFeedback(data.entry, resultContainer);
            break;
        case 'writing-exercise-form':
            displayWritingExercise(data.exercise, resultContainer);
            break;
        case 'writing-check-form':
            displayWritingFeedback(data.feedback, resultContainer);
            break;
        case 'immersion-content-form':
        case 'cultural-content-form':
            displayImmersionContent(data.content, resultContainer);
            break;
        case 'import-content-form':
            displayImportedContent(data.content, resultContainer);
            break;
        case 'youtube-processor-form':
            displayYouTubeContent(data.content, resultContainer);
            break;
        default:
            resultContainer.innerHTML = '<div class="alert alert-success">Request processed successfully!</div>';
    }
}

/**
 * Handle API error
 */
function handleApiError(error, formId) {
    console.error('API Error:', error);
    
    const resultContainer = document.getElementById(`${formId}-result`);
    
    if (resultContainer) {
        resultContainer.innerHTML = `
            <div class="alert alert-danger">
                <h5>Error</h5>
                <p>An error occurred while processing your request. Please try again later.</p>
                <p class="text-muted small">${error.message || ''}</p>
            </div>
        `;
    }
}

/**
 * Setup language switcher
 */
function setupLanguageSwitcher() {
    const languageItems = document.querySelectorAll('.dropdown-menu .dropdown-item');
    
    languageItems.forEach(item => {
        item.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Remove active class from all items
            languageItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Update button text
            const languageText = this.textContent.trim();
            const dropdownButton = document.getElementById('languageDropdown');
            
            if (dropdownButton) {
                dropdownButton.innerHTML = `<i class="fas fa-language me-1"></i> ${languageText}`;
            }
            
            // Store selected language in localStorage
            localStorage.setItem('selectedLanguage', languageText);
            
            // Optional: Reload content in the new language
            // reloadContentInLanguage(languageText);
        });
    });
    
    // Set initial language from localStorage if available
    const savedLanguage = localStorage.getItem('selectedLanguage');
    
    if (savedLanguage) {
        languageItems.forEach(item => {
            if (item.textContent.trim() === savedLanguage) {
                item.click();
            }
        });
    }
}

/**
 * Display lesson content
 */
function displayLesson(lesson, container) {
    if (!lesson) {
        container.innerHTML = '<div class="alert alert-warning">No lesson data available</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="card lesson-card mb-4">
            <div class="card-header bg-primary text-white">
                <h3 class="mb-0">${lesson.topic ? lesson.topic.charAt(0).toUpperCase() + lesson.topic.slice(1) : 'Language Lesson'}</h3>
                <div class="small">
                    <span class="badge bg-light text-dark me-2">${lesson.language}</span>
                    <span class="badge bg-light text-dark">${lesson.level}</span>
                </div>
            </div>
            <div class="card-body">
                <div class="lesson-content">
                    ${formatLessonContent(lesson.content)}
                </div>
            </div>
            <div class="card-footer d-flex justify-content-between">
                <button class="btn btn-sm btn-outline-primary" onclick="printLesson()">
                    <i class="fas fa-print me-1"></i> Print
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="saveLesson('${lesson.id}')">
                    <i class="fas fa-save me-1"></i> Save
                </button>
            </div>
        </div>
    `;
}

/**
 * Format lesson content with proper HTML
 */
function formatLessonContent(content) {
    if (!content) return '<p>No content available</p>';
    
    // Replace newlines with <br> tags
    let formattedContent = content.replace(/\n/g, '<br>');
    
    // Format section headings
    formattedContent = formattedContent.replace(/([A-Z][A-Za-z\s]+):/g, '<h4 class="mt-4">$1</h4>');
    
    return formattedContent;
}

/**
 * Setup typing exercise
 */
function setupTypingExercise() {
    const exerciseContainer = document.getElementById('typing-exercise');
    const languageSelect = document.getElementById('typing-language');
    const scriptSelect = document.getElementById('typing-script');
    const difficultySelect = document.getElementById('typing-difficulty');
    const generateButton = document.getElementById('generate-typing');
    
    if (!exerciseContainer || !generateButton) return;
    
    generateButton.addEventListener('click', function() {
        const language = languageSelect ? languageSelect.value : 'Spanish';
        const script = scriptSelect ? scriptSelect.value : 'standard';
        const difficulty = difficultySelect ? difficultySelect.value : 'beginner';
        
        // Show loading indicator
        exerciseContainer.innerHTML = '<div class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div><p class="mt-2">Generating typing exercise...</p></div>';
        
        // Fetch typing exercise
        fetch(`/api/typing_exercise?language=${language}&script_type=${script}&difficulty=${difficulty}`)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.exercise) {
                    displayTypingExercise(data.exercise, exerciseContainer);
                } else {
                    exerciseContainer.innerHTML = '<div class="alert alert-warning">Failed to generate typing exercise</div>';
                }
            })
            .catch(error => {
                console.error('Error fetching typing exercise:', error);
                exerciseContainer.innerHTML = '<div class="alert alert-danger">An error occurred while generating the typing exercise</div>';
            });
    });
}

/**
 * Display typing exercise
 */
function displayTypingExercise(exercise, container) {
    if (!exercise || !exercise.content) {
        container.innerHTML = '<div class="alert alert-warning">No exercise content available</div>';
        return;
    }
    
    // Parse the content to extract sections
    const contentLines = exercise.content.split('\n');
    let paragraph = '';
    let challengingChars = '';
    let tips = '';
    
    let currentSection = '';
    
    contentLines.forEach(line => {
        if (line.includes('paragraph') || line.includes('Paragraph') || line.includes('sentences')) {
            currentSection = 'paragraph';
        } else if (line.includes('challenging') || line.includes('Challenging') || line.includes('characters')) {
            currentSection = 'chars';
        } else if (line.includes('Tips') || line.includes('tips')) {
            currentSection = 'tips';
        } else if (line.trim() !== '') {
            if (currentSection === 'paragraph') {
                paragraph += line + ' ';
            } else if (currentSection === 'chars') {
                challengingChars += line + ' ';
            } else if (currentSection === 'tips') {
                tips += line + ' ';
            }
        }
    });
    
    // If we couldn't parse it properly, just use the whole content
    if (!paragraph) {
        paragraph = exercise.content;
    }
    
    container.innerHTML = `
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h3 class="mb-0">Typing Exercise</h3>
                <div class="small">
                    <span class="badge bg-light text-dark me-2">${exercise.language}</span>
                    <span class="badge bg-light text-dark me-2">${exercise.script_type}</span>
                    <span class="badge bg-light text-dark">${exercise.difficulty}</span>
                </div>
            </div>
            <div class="card-body">
                <h4>Practice Text</h4>
                <div class="typing-area mb-4" id="typing-text">${paragraph}</div>
                
                <div class="row">
                    <div class="col-md-6">
                        <h5>Challenging Characters</h5>
                        <p>${challengingChars || 'Not specified'}</p>
                    </div>
                    <div class="col-md-6">
                        <h5>Typing Tips</h5>
                        <p>${tips || 'Not specified'}</p>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h5>Your Practice Area</h5>
                    <textarea class="form-control typing-area" id="typing-input" rows="5" placeholder="Start typing here..."></textarea>
                </div>
            </div>
        </div>
    `;
    
    // Setup typing input event listeners
    const typingInput = document.getElementById('typing-input');
    if (typingInput) {
        typingInput.addEventListener('input', function() {
            // You could add real-time feedback here
        });
    }
}

/**
 * Setup journal editor
 */
function setupJournalEditor() {
    // This would integrate with a rich text editor like TinyMCE or Quill
    console.log('Journal editor setup would go here');
}

/**
 * Setup lesson generator
 */
function setupLessonGenerator() {
    // Any additional setup for the lesson generator
    console.log('Lesson generator setup would go here');
}

/**
 * Setup writing exercise
 */
function setupWritingExercise() {
    // Any additional setup for writing exercises
    console.log('Writing exercise setup would go here');
}

/**
 * Setup YouTube processor
 */
function setupYouTubeProcessor() {
    const form = document.getElementById('youtube-processor-form');
    const urlInput = document.getElementById('youtube-url');
    const previewButton = document.getElementById('preview-youtube');
    const previewContainer = document.getElementById('youtube-preview');
    
    if (!form || !urlInput || !previewButton || !previewContainer) return;
    
    previewButton.addEventListener('click', function() {
        const url = urlInput.value.trim();
        
        if (!url) {
            previewContainer.innerHTML = '<div class="alert alert-warning">Please enter a YouTube URL</div>';
            return;
        }
        
        // Extract video ID from URL
        const videoId = extractYouTubeId(url);
        
        if (!videoId) {
            previewContainer.innerHTML = '<div class="alert alert-danger">Invalid YouTube URL</div>';
            return;
        }
        
        // Display embedded player
        previewContainer.innerHTML = `
            <div class="ratio ratio-16x9 mb-3">
                <iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <input type="hidden" name="video_id" value="${videoId}">
        `;
    });
}

/**
 * Extract YouTube video ID from URL
 */
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
}

/**
 * Print lesson
 */
function printLesson() {
    window.print();
}

/**
 * Save lesson to user's saved lessons
 */
function saveLesson(lessonId) {
    // This would typically make an API call to save the lesson to the user's account
    alert('Lesson saved successfully!');
}

/**
 * Display journal feedback
 */
function displayJournalFeedback(entry, container) {
    // Implementation would go here
}

/**
 * Display writing exercise
 */
function displayWritingExercise(exercise, container) {
    // Implementation would go here
}

/**
 * Display writing feedback
 */
function displayWritingFeedback(feedback, container) {
    // Implementation would go here
}

/**
 * Display immersion content
 */
function displayImmersionContent(content, container) {
    // Implementation would go here
}

/**
 * Display imported content
 */
function displayImportedContent(content, container) {
    // Implementation would go here
}

/**
 * Display YouTube content
 */
function displayYouTubeContent(content, container) {
    // Implementation would go here
}

/**
 * Setup theme toggle functionality
 */
function setupThemeToggle() {
    // Check for saved theme preference or use system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // Set initial theme to orange by default
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        document.documentElement.setAttribute('data-theme', 'orange');
        localStorage.setItem('theme', 'orange');
    }
    
    // Find the existing theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        // Update the icon based on the current theme
        updateThemeIcon();
        
        // Add event listener to theme toggle button
        themeToggle.addEventListener('click', toggleTheme);
        
        console.log('Theme toggle button initialized');
    } else {
        console.warn('Theme toggle button not found in the DOM');
    }
}

/**
 * Update theme toggle icon based on current theme
 */
function updateThemeIcon() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const themeToggle = document.getElementById('theme-toggle');
    
    if (!themeToggle) return;
    
    let themeIcon;
    switch (currentTheme) {
        case 'dark':
            themeIcon = 'sun';
            break;
        case 'orange':
            themeIcon = 'adjust';
            break;
        default: // light
            themeIcon = 'moon';
    }
    
    themeToggle.innerHTML = `<i class="fas fa-${themeIcon}"></i>`;
    
    // Log the current theme for debugging
    console.log('Current theme:', currentTheme);
}

/**
 * Toggle between light, dark, and orange themes
 */
function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    let newTheme;
    
    // Cycle through themes: light -> dark -> orange -> light
    switch (currentTheme) {
        case 'light':
            newTheme = 'dark';
            break;
        case 'dark':
            newTheme = 'orange';
            break;
        case 'orange':
            newTheme = 'light';
            break;
        default:
            newTheme = 'light';
    }
    
    // Update theme
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button icon
    updateThemeIcon();
}

/**
 * Setup amber screen filter for blue light protection
 */
function setupAmberFilter() {
    // Check for saved amber filter preference
    const amberFilterEnabled = localStorage.getItem('amberFilter') === 'true';
    
    // Create amber filter element if it doesn't exist
    if (!document.getElementById('amber-filter')) {
        const amberFilter = document.createElement('div');
        amberFilter.id = 'amber-filter';
        amberFilter.className = 'amber-filter';
        amberFilter.style.opacity = '0';
        document.body.appendChild(amberFilter);
    }
    
    // Find the existing amber filter toggle button
    const amberToggle = document.getElementById('amber-filter-toggle');
    if (amberToggle) {
        // Add event listener to amber filter toggle button
        amberToggle.addEventListener('click', toggleAmberFilter);
        
        // Set initial state
        if (amberFilterEnabled) {
            enableAmberFilter();
        }
        
        console.log('Amber filter button initialized');
    } else {
        console.warn('Amber filter button not found in the DOM');
    }
}

/**
 * Toggle amber screen filter
 */
function toggleAmberFilter() {
    const amberFilterEnabled = localStorage.getItem('amberFilter') === 'true';
    
    if (amberFilterEnabled) {
        disableAmberFilter();
    } else {
        enableAmberFilter();
    }
}

/**
 * Enable amber screen filter
 */
function enableAmberFilter() {
    const amberFilter = document.getElementById('amber-filter');
    const amberToggle = document.getElementById('amber-filter-toggle');
    
    if (amberFilter) {
        amberFilter.style.opacity = '1';
    }
    
    if (amberToggle) {
        amberToggle.classList.add('active');
        amberToggle.innerHTML = '<i class="fas fa-eye"></i>';
    }
    
    localStorage.setItem('amberFilter', 'true');
}

/**
 * Disable amber screen filter
 */
function disableAmberFilter() {
    const amberFilter = document.getElementById('amber-filter');
    const amberToggle = document.getElementById('amber-filter-toggle');
    
    if (amberFilter) {
        amberFilter.style.opacity = '0';
    }
    
    if (amberToggle) {
        amberToggle.classList.remove('active');
        amberToggle.innerHTML = '<i class="fas fa-eye-slash"></i>';
    }
    
    localStorage.setItem('amberFilter', 'false');
}
