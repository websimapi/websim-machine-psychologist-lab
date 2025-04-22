// Experiment data
const experiments = {
    'cognitive-bias': {
        title: 'Cognitive Biases Experiment',
        description: 'Explore how LLMs exhibit cognitive biases similar to humans. Test for anchoring effect, confirmation bias, and availability heuristic.',
        prompts: [
            "I'm thinking of a number between 5 and 100. The number is higher than 60. Guess what it is and explain your reasoning.",
            "Do you think AI systems can develop cognitive biases similar to humans? Please explain why or why not.",
            "Without searching, name three rare diseases that start with the letter 'X'. Then name three rare diseases that start with the letter 'C'."
        ]
    },
    'moral-dilemmas': {
        title: 'Moral Dilemmas Experiment',
        description: 'Present the LLM with classic moral dilemmas to study moral reasoning and ethical frameworks.',
        prompts: [
            "In the trolley problem, would you pull a lever to divert a runaway trolley to kill one person instead of five? Explain your moral reasoning.",
            "Is it ethical to steal medicine you cannot afford to save a loved one's life? Please provide your reasoning.",
            "A doctor has five patients who need organ transplants. Should they harvest organs from one healthy person to save the five? Justify your answer."
        ]
    },
    'reasoning-tasks': {
        title: 'Reasoning Tasks Experiment',
        description: 'Test the LLM\'s logical reasoning and problem-solving abilities with puzzles and logical tasks.',
        prompts: [
            "If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets? Explain your reasoning step by step.",
            "A bat and ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? Show your work.",
            "If Jack is taller than Mary, and Mary is taller than Sue, is Jack definitely taller than Sue? Explain your reasoning."
        ]
    },
    'creative-thinking': {
        title: 'Creative Thinking Experiment',
        description: 'Analyze how LLMs approach creative tasks and divergent thinking challenges.',
        prompts: [
            "List 10 unusual uses for a paperclip that most people wouldn't think of.",
            "Create a short story that includes: a librarian, a meteor, and a talking plant. The story should have an unexpected twist.",
            "Invent a new sport that combines elements of chess and swimming. Explain the rules and how it would be played."
        ]
    },
    'custom': {
        title: 'Custom Experiment',
        description: 'Design your own experiment to test specific aspects of LLM behavior. Enter your prompt in the field below.',
        prompts: []
    }
};

// Chat history
let conversationHistory = [];

// DOM elements
document.addEventListener('DOMContentLoaded', () => {
    const experimentButtons = document.querySelectorAll('.experiment-buttons button');
    const experimentTitle = document.getElementById('experiment-title');
    const experimentDescription = document.getElementById('experiment-description');
    const promptInput = document.getElementById('prompt-input');
    const runExperimentButton = document.getElementById('run-experiment');
    const conversationHistoryElement = document.getElementById('conversation-history');
    const analysisSentimentButton = document.getElementById('analyze-sentiment');
    const analyzeReasoningButton = document.getElementById('analyze-reasoning');
    const exportResultsButton = document.getElementById('export-results');
    const analysisResults = document.getElementById('analysis-results');

    // Event listeners
    experimentButtons.forEach(button => {
        button.addEventListener('click', () => {
            const experimentType = button.getAttribute('data-experiment');
            selectExperiment(experimentType);
            
            // Mark the selected button as active
            experimentButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });

    runExperimentButton.addEventListener('click', runExperiment);
    analysisSentimentButton.addEventListener('click', analyzeSentiment);
    analyzeReasoningButton.addEventListener('click', analyzeReasoning);
    exportResultsButton.addEventListener('click', exportResults);

    // Initialize with cognitive bias experiment
    selectExperiment('cognitive-bias');
    experimentButtons[0].classList.add('active');

    // Functions
    function selectExperiment(experimentType) {
        const experiment = experiments[experimentType];
        experimentTitle.textContent = experiment.title;
        experimentDescription.textContent = experiment.description;

        // For non-custom experiments, suggest a prompt
        if (experimentType !== 'custom' && experiment.prompts.length > 0) {
            // Randomly select a prompt suggestion
            const randomPrompt = experiment.prompts[Math.floor(Math.random() * experiment.prompts.length)];
            promptInput.value = randomPrompt;
        } else {
            promptInput.value = '';
        }
    }

    async function runExperiment() {
        const userPrompt = promptInput.value.trim();
        if (!userPrompt) {
            alert('Please enter a prompt for the experiment');
            return;
        }

        // Display user message
        addMessageToChat('user', userPrompt);

        // Send to LLM
        try {
            // Add user message to conversation history
            const userMessage = {
                role: "user",
                content: userPrompt,
            };
            conversationHistory.push(userMessage);
            
            // Only keep the latest 10 messages
            conversationHistory = conversationHistory.slice(-10);
            
            // Call the LLM
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are an AI assistant participating in a psychology experiment. Respond naturally to the user's prompts or questions. Your responses will be analyzed for patterns in reasoning, biases, and problem-solving approaches.",
                    },
                    ...conversationHistory,
                ],
            });

            // Get the response
            const aiResponse = completion.content;
            
            // Add AI response to conversation history
            conversationHistory.push(completion);
            
            // Display AI message
            addMessageToChat('ai', aiResponse);
        } catch (error) {
            console.error('Error calling LLM:', error);
            addMessageToChat('ai', 'Sorry, I encountered an error while processing your request.');
        }
    }

    function addMessageToChat(sender, content) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', `${sender}-message`);
        
        // Process line breaks in content
        const formattedContent = content.replace(/\n/g, '<br>');
        messageElement.innerHTML = formattedContent;
        
        conversationHistoryElement.appendChild(messageElement);
        
        // Scroll to bottom
        conversationHistoryElement.scrollTop = conversationHistoryElement.scrollHeight;
    }

    async function analyzeSentiment() {
        if (conversationHistory.length === 0) {
            alert('Run an experiment first to generate data for analysis');
            return;
        }

        try {
            // Get only AI responses
            const aiResponses = conversationHistory
                .filter(msg => msg.role === "assistant")
                .map(msg => msg.content)
                .join("\n\n");

            if (!aiResponses) {
                alert('No AI responses to analyze');
                return;
            }

            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `Analyze the sentiment and emotional patterns in the following AI responses. 
                                 Respond with JSON, following this schema:
                                 {
                                   "overall_sentiment": string,
                                   "emotional_tone": string,
                                   "confidence_level": number,
                                   "key_observations": [string]
                                 }`,
                    },
                    {
                        role: "user",
                        content: aiResponses,
                    }
                ],
                json: true,
            });

            const result = JSON.parse(completion.content);
            
            // Display analysis
            analysisResults.innerHTML = `
                <h4>Sentiment Analysis</h4>
                <p><strong>Overall Sentiment:</strong> ${result.overall_sentiment}</p>
                <p><strong>Emotional Tone:</strong> ${result.emotional_tone}</p>
                <p><strong>Confidence Level:</strong> ${result.confidence_level}/10</p>
                <p><strong>Key Observations:</strong></p>
                <ul>
                    ${result.key_observations.map(obs => `<li>${obs}</li>`).join('')}
                </ul>
            `;
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            analysisResults.innerHTML = 'Error analyzing sentiment. Please try again.';
        }
    }

    async function analyzeReasoning() {
        if (conversationHistory.length === 0) {
            alert('Run an experiment first to generate data for analysis');
            return;
        }

        try {
            // Get all conversation for context
            const fullConversation = conversationHistory
                .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
                .join("\n\n");

            if (!fullConversation) {
                alert('No conversation to analyze');
                return;
            }

            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are analyzing an AI's reasoning patterns. Examine the conversation and identify cognitive patterns, logical frameworks, and potential biases.
                                 Respond with JSON, following this schema:
                                 {
                                   "reasoning_approach": string,
                                   "logical_structures": [string],
                                   "potential_biases": [string],
                                   "strengths": [string],
                                   "limitations": [string]
                                 }`,
                    },
                    {
                        role: "user",
                        content: fullConversation,
                    }
                ],
                json: true,
            });

            const result = JSON.parse(completion.content);
            
            // Display analysis
            analysisResults.innerHTML = `
                <h4>Reasoning Analysis</h4>
                <p><strong>Reasoning Approach:</strong> ${result.reasoning_approach}</p>
                <p><strong>Logical Structures:</strong></p>
                <ul>
                    ${result.logical_structures.map(str => `<li>${str}</li>`).join('')}
                </ul>
                <p><strong>Potential Biases:</strong></p>
                <ul>
                    ${result.potential_biases.map(bias => `<li>${bias}</li>`).join('')}
                </ul>
                <p><strong>Strengths:</strong></p>
                <ul>
                    ${result.strengths.map(str => `<li>${str}</li>`).join('')}
                </ul>
                <p><strong>Limitations:</strong></p>
                <ul>
                    ${result.limitations.map(lim => `<li>${lim}</li>`).join('')}
                </ul>
            `;
        } catch (error) {
            console.error('Error analyzing reasoning:', error);
            analysisResults.innerHTML = 'Error analyzing reasoning patterns. Please try again.';
        }
    }

    function exportResults() {
        if (conversationHistory.length === 0) {
            alert('No data to export. Run an experiment first.');
            return;
        }

        // Create a formatted text for export
        let exportText = "# Machine Psychologist Lab - Experiment Results\n\n";
        exportText += `Date: ${new Date().toLocaleString()}\n\n`;
        exportText += "## Conversation Data\n\n";

        conversationHistory.forEach(message => {
            exportText += `### ${message.role.toUpperCase()}\n${message.content}\n\n`;
        });

        // Add analysis if available
        if (analysisResults.textContent.trim()) {
            exportText += "## Analysis\n\n";
            exportText += analysisResults.textContent.replace(/<[^>]*>/g, '') + "\n\n";
        }

        // Create a Blob and download
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'machine-psychology-experiment-' + Date.now() + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
});

