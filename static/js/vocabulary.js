// Vocabulary System JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentLanguage = 'Spanish';
    let currentFilter = 'all';
    let currentWordType = 'all';
    let currentSort = 'recent';
    let vocabularyData = [];
    
    // Initialize the vocabulary system
    initVocabulary();
    
    // Function to initialize the vocabulary system
    function initVocabulary() {
        // Load sample vocabulary data
        loadSampleVocabulary();
        
        // Set up event listeners
        setupEventListeners();
    }
    
    // Function to set up event listeners
    function setupEventListeners() {
        // Language selection
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                currentLanguage = this.dataset.language;
                document.getElementById('currentLanguage').textContent = currentLanguage;
                document.getElementById('wordLanguage').value = currentLanguage;
                
                // Update active class
                document.querySelectorAll('.language-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                this.classList.add('active');
                
                // Reload vocabulary
                loadSampleVocabulary();
            });
        });
        
        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                currentFilter = this.dataset.filter;
                
                // Update active class
                document.querySelectorAll('.filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                this.classList.add('active');
                
                // Filter vocabulary
                renderVocabulary();
            });
        });
        
        // Word type options
        document.querySelectorAll('.word-type-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                currentWordType = this.dataset.type;
                
                // Update dropdown text
                const typeText = currentWordType === 'all' ? 'Word Type' : this.textContent;
                document.getElementById('wordTypeFilter').textContent = typeText;
                
                // Filter vocabulary
                renderVocabulary();
            });
        });
        
        // Sort options
        document.querySelectorAll('.sort-option').forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                currentSort = this.dataset.sort;
                
                // Update dropdown text
                document.getElementById('sortFilter').textContent = this.textContent;
                
                // Sort vocabulary
                renderVocabulary();
            });
        });
        
        // Search functionality
        const searchInput = document.getElementById('searchVocabulary');
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                renderVocabulary();
            });
        }
        
        // Add word form submission
        const saveWordBtn = document.getElementById('saveWordBtn');
        if (saveWordBtn) {
            saveWordBtn.addEventListener('click', function() {
                saveWord();
            });
        }
        
        // Process reading content for word tapping
        const readingContent = document.getElementById('readingContent');
        if (readingContent) {
            processTextContent(readingContent);
        }
    }
    
    // Function to load sample vocabulary data
    function loadSampleVocabulary() {
        vocabularyData = [
            {
                id: 1,
                word: 'el restaurante',
                translation: 'restaurant',
                word_type: 'noun',
                familiarity_level: 5,
                last_reviewed: new Date().toISOString()
            },
            {
                id: 2,
                word: 'pedir',
                translation: 'to order',
                word_type: 'verb',
                familiarity_level: 3,
                last_reviewed: new Date(Date.now() - 86400000).toISOString() // yesterday
            },
            {
                id: 3,
                word: 'la cuenta',
                translation: 'the bill',
                word_type: 'noun',
                familiarity_level: 2,
                last_reviewed: new Date(Date.now() - 172800000).toISOString() // 2 days ago
            },
            {
                id: 4,
                word: 'delicioso',
                translation: 'delicious',
                word_type: 'adjective',
                familiarity_level: 1,
                last_reviewed: new Date().toISOString()
            },
            {
                id: 5,
                word: 'la mesa',
                translation: 'table',
                word_type: 'noun',
                familiarity_level: 4,
                last_reviewed: new Date(Date.now() - 259200000).toISOString() // 3 days ago
            }
        ];
        
        // Update stats
        updateStats();
        
        // Render vocabulary
        renderVocabulary();
    }
    
    // Function to update stats
    function updateStats() {
        document.getElementById('totalWords').textContent = vocabularyData.length;
        document.getElementById('masteredWords').textContent = vocabularyData.filter(w => w.familiarity_level === 5).length;
        document.getElementById('learningWords').textContent = vocabularyData.filter(w => w.familiarity_level > 0 && w.familiarity_level < 5).length;
        document.getElementById('newWords').textContent = vocabularyData.filter(w => w.familiarity_level === 0).length;
    }
    
    // Function to render the vocabulary table
    function renderVocabulary() {
        const tableBody = document.getElementById('vocabularyTableBody');
        const emptyState = document.getElementById('vocabularyEmptyState');
        const pagination = document.getElementById('vocabularyPagination');
        
        // Filter data based on current filters
        const filteredData = filterVocabularyData();
        
        if (filteredData.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) emptyState.classList.remove('d-none');
            if (pagination) pagination.classList.add('d-none');
            return;
        }
        
        if (emptyState) emptyState.classList.add('d-none');
        if (pagination) pagination.classList.remove('d-none');
        
        let html = '';
        
        filteredData.forEach(word => {
            // Determine progress bar color based on familiarity level
            let progressBarClass = 'bg-info';
            if (word.familiarity_level >= 4) {
                progressBarClass = 'bg-success';
            } else if (word.familiarity_level >= 2) {
                progressBarClass = 'bg-warning';
            }
            
            // Format last reviewed date
            const lastReviewed = new Date(word.last_reviewed);
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            let lastReviewedText = '';
            if (lastReviewed.toDateString() === today.toDateString()) {
                lastReviewedText = 'Today';
            } else if (lastReviewed.toDateString() === yesterday.toDateString()) {
                lastReviewedText = 'Yesterday';
            } else {
                const days = Math.round((today - lastReviewed) / (1000 * 60 * 60 * 24));
                lastReviewedText = `${days} days ago`;
            }
            
            // Determine badge color based on word type
            let badgeClass = 'bg-secondary';
            switch (word.word_type) {
                case 'noun':
                    badgeClass = 'bg-success';
                    break;
                case 'verb':
                    badgeClass = 'bg-primary';
                    break;
                case 'adjective':
                    badgeClass = 'bg-info';
                    break;
                case 'adverb':
                    badgeClass = 'bg-warning';
                    break;
                case 'phrase':
                    badgeClass = 'bg-danger';
                    break;
            }
            
            html += `
                <tr data-word-id="${word.id}">
                    <td>
                        <div class="d-flex align-items-center">
                            <span class="me-2">${word.word}</span>
                            <button class="btn btn-sm btn-link p-0 audio-btn">
                                <i class="fas fa-volume-up"></i>
                            </button>
                        </div>
                    </td>
                    <td>${word.translation}</td>
                    <td><span class="badge ${badgeClass}">${word.word_type}</span></td>
                    <td>
                        <div class="progress" style="height: 8px; width: 100px;">
                            <div class="progress-bar ${progressBarClass}" role="progressbar" style="width: ${word.familiarity_level * 20}%;" aria-valuenow="${word.familiarity_level * 20}" aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                    </td>
                    <td>${lastReviewedText}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1 practice-btn">Practice</button>
                        <button class="btn btn-sm btn-outline-secondary word-menu-btn">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        
        // Add event listeners to audio buttons
        document.querySelectorAll('.audio-btn').forEach(button => {
            button.addEventListener('click', function() {
                const wordElement = this.parentElement.querySelector('span');
                const word = wordElement.textContent;
                
                // In a real implementation, this would play the audio
                console.log('Playing audio for:', word);
                
                // Visual feedback
                const icon = this.querySelector('i');
                icon.classList.remove('fa-volume-up');
                icon.classList.add('fa-volume-down');
                
                setTimeout(() => {
                    icon.classList.remove('fa-volume-down');
                    icon.classList.add('fa-volume-up');
                }, 1000);
            });
        });
    }
    
    // Function to filter vocabulary data
    function filterVocabularyData() {
        const searchInput = document.getElementById('searchVocabulary');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        // Apply filters
        return vocabularyData.filter(word => {
            // Filter by search term
            if (searchTerm && !word.word.toLowerCase().includes(searchTerm) && !word.translation.toLowerCase().includes(searchTerm)) {
                return false;
            }
            
            // Filter by familiarity level
            if (currentFilter !== 'all') {
                if (currentFilter === 'mastered' && word.familiarity_level !== 5) {
                    return false;
                } else if (currentFilter === 'learning' && (word.familiarity_level === 0 || word.familiarity_level === 5)) {
                    return false;
                } else if (currentFilter === 'new' && word.familiarity_level !== 0) {
                    return false;
                }
            }
            
            // Filter by word type
            if (currentWordType !== 'all' && word.word_type !== currentWordType) {
                return false;
            }
            
            return true;
        }).sort((a, b) => {
            // Sort based on current sort option
            switch (currentSort) {
                case 'recent':
                    return new Date(b.created_at || b.last_reviewed) - new Date(a.created_at || a.last_reviewed);
                case 'az':
                    return a.word.localeCompare(b.word);
                case 'za':
                    return b.word.localeCompare(a.word);
                case 'mastery':
                    return b.familiarity_level - a.familiarity_level;
                default:
                    return 0;
            }
        });
    }
    
    // Function to save a word to the vocabulary
    function saveWord() {
        const wordText = document.getElementById('wordText').value;
        const wordTranslation = document.getElementById('wordTranslation').value;
        const wordType = document.getElementById('wordType').value;
        const wordNotes = document.getElementById('wordNotes').value;
        const wordTags = document.getElementById('wordTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (!wordText || !wordTranslation || !wordType) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // For demo purposes, simulate success
        const modal = bootstrap.Modal.getInstance(document.getElementById('addWordModal'));
        if (modal) modal.hide();
        
        document.getElementById('addWordForm').reset();
        
        showNotification('Word added to vocabulary!', 'success');
        
        // Add to sample data
        const newWord = {
            id: vocabularyData.length + 1,
            word: wordText,
            translation: wordTranslation,
            word_type: wordType,
            notes: wordNotes,
            tags: wordTags,
            language: currentLanguage,
            familiarity_level: 0,
            created_at: new Date().toISOString(),
            last_reviewed: null
        };
        
        vocabularyData.unshift(newWord);
        
        // Update stats
        updateStats();
        
        // Re-render vocabulary
        renderVocabulary();
    }
    
    // Function to process text content for word tapping
    function processTextContent(element) {
        if (!element) return;
        
        // Get all text nodes in the element
        const textNodes = [];
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
        
        let node;
        while (node = walker.nextNode()) {
            // Skip empty text nodes
            if (node.nodeValue.trim() === '') continue;
            
            // Skip text nodes in elements that shouldn't be tappable
            const parent = node.parentNode;
            if (parent.tagName === 'BUTTON' || parent.tagName === 'A' || parent.tagName === 'INPUT' || parent.tagName === 'TEXTAREA') {
                continue;
            }
            
            textNodes.push(node);
        }
        
        // Process each text node
        textNodes.forEach(textNode => {
            const text = textNode.nodeValue;
            const parent = textNode.parentNode;
            
            // Split text into words, preserving punctuation
            const regex = /(\w+)([^\w\s]*\s*)/g;
            let match;
            let processedHTML = '';
            let lastIndex = 0;
            
            while ((match = regex.exec(text)) !== null) {
                // Add any text before the match
                if (match.index > lastIndex) {
                    processedHTML += text.substring(lastIndex, match.index);
                }
                
                const word = match[1];
                const punctuation = match[2];
                
                // Create tappable span for the word
                processedHTML += `<span class="tappable-word" data-word="${word}">${word}</span>${punctuation}`;
                
                lastIndex = regex.lastIndex;
            }
            
            // Add any remaining text
            if (lastIndex < text.length) {
                processedHTML += text.substring(lastIndex);
            }
            
            // Replace the text node with the processed HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = processedHTML;
            
            const fragment = document.createDocumentFragment();
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
            
            parent.replaceChild(fragment, textNode);
        });
        
        // Add click event listeners to tappable words
        element.querySelectorAll('.tappable-word').forEach(wordSpan => {
            wordSpan.addEventListener('click', handleWordTap);
        });
    }
    
    // Function to handle word tap
    function handleWordTap(event) {
        const word = event.target.dataset.word;
        const context = getWordContext(event.target);
        
        // Show word popup
        showWordPopup(word, context, event);
    }
    
    // Function to get word context
    function getWordContext(wordElement) {
        // Get surrounding text for context (e.g., the sentence containing the word)
        const paragraph = wordElement.closest('p, div, span');
        if (!paragraph) return '';
        
        return paragraph.textContent.trim();
    }
    
    // Function to show word popup
    function showWordPopup(word, context, event) {
        // Remove any existing popups
        const existingPopup = document.querySelector('.word-popup');
        if (existingPopup) {
            existingPopup.remove();
        }
        
        // Create popup element
        const popup = document.createElement('div');
        popup.className = 'word-popup';
        
        // Add translation input and buttons
        popup.innerHTML = `
            <div class="word-popup-header">
                <h3>${word}</h3>
                <button class="close-popup">&times;</button>
            </div>
            <div class="word-popup-body">
                <div class="form-group mb-3">
                    <label for="translation" class="form-label">Translation:</label>
                    <input type="text" id="translation" class="form-control" placeholder="Enter translation">
                </div>
                <div class="form-group mb-3">
                    <label for="word-type" class="form-label">Word Type:</label>
                    <select id="word-type" class="form-select">
                        <option value="" selected disabled>Select word type</option>
                        <option value="noun">Noun</option>
                        <option value="verb">Verb</option>
                        <option value="adjective">Adjective</option>
                        <option value="adverb">Adverb</option>
                        <option value="phrase">Phrase</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <div class="form-group mb-3">
                    <label for="notes" class="form-label">Notes:</label>
                    <textarea id="notes" class="form-control" placeholder="Add notes"></textarea>
                </div>
            </div>
            <div class="word-popup-footer">
                <button id="save-word" class="btn btn-primary">Save Word</button>
                <button id="translate-ai" class="btn btn-secondary">Translate with AI</button>
            </div>
        `;
        
        // Add to document
        document.body.appendChild(popup);
        
        // Position popup near the word
        positionPopup(popup, event.target);
        
        // Add event listeners
        popup.querySelector('.close-popup').addEventListener('click', () => {
            popup.remove();
        });
        
        popup.querySelector('#save-word').addEventListener('click', () => {
            const translation = popup.querySelector('#translation').value;
            const wordType = popup.querySelector('#word-type').value;
            const notes = popup.querySelector('#notes').value;
            
            if (!translation || !wordType) {
                showNotification('Please enter a translation and select a word type', 'error');
                return;
            }
            
            // Save word to vocabulary
            saveWordFromPopup(word, context, translation, wordType, notes);
            popup.remove();
        });
        
        popup.querySelector('#translate-ai').addEventListener('click', () => {
            // Call AI translation API
            translateWithAI(word, context, popup);
        });
    }
    
    // Function to position popup
    function positionPopup(popup, target) {
        const targetRect = target.getBoundingClientRect();
        const popupWidth = popup.offsetWidth;
        const popupHeight = popup.offsetHeight;
        
        // Position popup below the word
        let top = targetRect.bottom + window.scrollY + 5;
        let left = targetRect.left + window.scrollX;
        
        // Adjust if popup would go off screen
        if (left + popupWidth > window.innerWidth) {
            left = window.innerWidth - popupWidth - 10;
        }
        
        if (top + popupHeight > window.innerHeight + window.scrollY) {
            // Position above the word if it would go off the bottom
            top = targetRect.top + window.scrollY - popupHeight - 5;
        }
        
        popup.style.top = `${top}px`;
        popup.style.left = `${left}px`;
    }
    
    // Function to save word from popup
    function saveWordFromPopup(word, context, translation, wordType, notes) {
        // Prepare form data for the add word modal
        document.getElementById('wordText').value = word;
        document.getElementById('wordTranslation').value = translation;
        document.getElementById('wordType').value = wordType;
        document.getElementById('wordNotes').value = notes;
        document.getElementById('wordTags').value = '';
        
        // Call the save word function
        saveWord();
    }
    
    // Function to translate word with AI
    function translateWithAI(word, context, popup) {
        // Show loading state
        const translationInput = popup.querySelector('#translation');
        translationInput.value = 'Translating...';
        translationInput.disabled = true;
        
        // Simulate API call with timeout
        setTimeout(() => {
            // Simulate response
            const translations = {
                'el restaurante': { translation: 'restaurant', word_type: 'noun', notes: 'A place where meals are served to customers.' },
                'pedir': { translation: 'to order', word_type: 'verb', notes: 'To request food or drinks in a restaurant.' },
                'la cuenta': { translation: 'the bill', word_type: 'noun', notes: 'The amount to be paid after a meal.' },
                'delicioso': { translation: 'delicious', word_type: 'adjective', notes: 'Having a very pleasant taste or smell.' },
                'la mesa': { translation: 'table', word_type: 'noun', notes: 'A piece of furniture with a flat top supported by legs.' }
            };
            
            // Get translation or generate a random one
            const translation = translations[word] || {
                translation: `Translation of "${word}"`,
                word_type: ['noun', 'verb', 'adjective', 'adverb', 'phrase'][Math.floor(Math.random() * 5)],
                notes: `This is a sample translation of "${word}" based on the context: "${context}"`
            };
            
            // Update translation input
            translationInput.value = translation.translation;
            
            // If word type was detected, update that too
            if (translation.word_type) {
                popup.querySelector('#word-type').value = translation.word_type;
            }
            
            // If notes were generated, update those too
            if (translation.notes) {
                popup.querySelector('#notes').value = translation.notes;
            }
            
            translationInput.disabled = false;
        }, 1000);
    }
    
    // Function to show notification
    function showNotification(message, type = 'success') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 3000);
    }
    
    // Initialize content import
    function initContentImport() {
        // Add event listeners for content import
        const importContentBtn = document.getElementById('importContentBtn');
        if (importContentBtn) {
            importContentBtn.addEventListener('click', function() {
                const title = document.getElementById('contentTitle').value;
                const contentType = document.getElementById('contentType').value;
                const content = document.getElementById('contentText').value;
                
                if (!title || !content) {
                    showNotification('Please enter a title and content', 'error');
                    return;
                }
                
                // For demo purposes, simulate success
                showNotification('Content imported successfully!', 'success');
                
                // Reset form
                document.getElementById('contentTitle').value = '';
                document.getElementById('contentText').value = '';
                
                // Update content
                document.getElementById('readingContent').innerHTML = `
                    <h3>${title}</h3>
                    ${content.split('\n').map(p => `<p>${p}</p>`).join('')}
                `;
                
                // Process text content for word tapping
                processTextContent(document.getElementById('readingContent'));
            });
        }
    }
});
