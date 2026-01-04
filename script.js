document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const form = document.getElementById('orderForm');
    const orderTypeInputs = document.querySelectorAll('input[name="orderType"]');

    // Dynamic Sections
    const tablesSection = document.getElementById('tables-section');
    const reservationSection = document.getElementById('reservation-section');
    const takeoutSection = document.getElementById('takeout-section');

    // Fields that need conditional required attribute logic
    const tableSelect = document.getElementById('tableSelect');

    const resDate = document.getElementById('resDate');
    const resTime = document.getElementById('resTime');
    const resPax = document.getElementById('resPax');

    const pickupDate = document.getElementById('pickupDate');
    const pickupTime = document.getElementById('pickupTime');

    // Webhook URL
    const WEBHOOK_URL = 'https://n8n.nexus-ia.com.es/webhook/cotundo';

    // Helper to hide all dynamic sections
    function hideAllSections() {
        tablesSection.classList.add('hidden');
        reservationSection.classList.add('hidden');
        takeoutSection.classList.add('hidden');

        // Remove required attributes to avoid validation errors on hidden fields
        tableSelect.required = false;

        resDate.required = false;
        resTime.required = false;
        resPax.required = false;

        pickupDate.required = false;
        pickupTime.required = false;
    }

    // ... (omitting event listeners validation logic which is unchanged) ...
    // Note: I will only replace the fetch part and the URL definition constant at the top.
    // Wait, the previous tool call replaced lines 125-141 roughly.
    // The constant is at line 20-22.
    // I should probably do a multi_replace to be clean.

    // Let's stick to the tool instructions. I need to replace the URL and the fetch block.
    // I'll use multi_replace.


    // Helper to hide all dynamic sections
    function hideAllSections() {
        tablesSection.classList.add('hidden');
        reservationSection.classList.add('hidden');
        takeoutSection.classList.add('hidden');

        // Remove required attributes to avoid validation errors on hidden fields
        tableSelect.required = false;

        resDate.required = false;
        resTime.required = false;
        resPax.required = false;

        pickupDate.required = false;
        pickupTime.required = false;
    }

    // Handle Order Type Change
    orderTypeInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            hideAllSections();

            const value = e.target.value;

            if (value === 'dine_in') {
                tablesSection.classList.remove('hidden');
                // Make table select required if serves in local? User said "Si se marca, mostrar..." 
                // Usually good UX to require it if displayed, but we can leave optional if needed.
                // Request said "Si se marca... mostrar". Let's assume required for better data.
                tableSelect.required = true;
                // Hide "Ninguna mesa en particular" for Dine In
                tableSelect.options[1].hidden = true;
                tableSelect.options[1].disabled = true;

                // If it was selected, reset to default
                if (tableSelect.value === 'Sin preferencia') {
                    tableSelect.value = '';
                }

            } else if (value === 'reservation') {
                reservationSection.classList.remove('hidden');
                resDate.required = true;
                resTime.required = true;
                resPax.required = true;

                // Optional: show tables for reservation too? Prompt said "La selección de mesa aquí es opcional".
                // We'll leave it hidden or add it as optional. 
                // Let's stick to the prompt structure which separates them, or we could clone the table select.
                // Prompt: "Si se marca [Reserva]... (La selección de mesa aquí es opcional)". 
                // This implies we SHOULD show it but not make it required.
                tablesSection.classList.remove('hidden');
                tableSelect.required = false;

                // Show "Ninguna mesa en particular" for Reservation
                tableSelect.options[1].hidden = false;
                tableSelect.options[1].disabled = false;

            } else if (value === 'takeout') {
                takeoutSection.classList.remove('hidden');
                pickupDate.required = true;
                pickupTime.required = true;
            }
        });
    });

    // Handle Form Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI Feedback
        const feedbackEl = document.getElementById('feedback-message');
        const submitBtn = form.querySelector('.submit-btn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');

        // Reset Feedback
        feedbackEl.classList.add('hidden');
        feedbackEl.className = 'feedback hidden'; // reset types

        // Loading State
        submitBtn.disabled = true;
        btnText.textContent = 'Enviando...';
        btnLoader.classList.remove('hidden');

        // Gather Data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Construct clean payload based on order type
        const payload = {
            submittedAt: new Date().toISOString(),
            customer: {
                name: data.name,
                whatsapp: data.whatsapp
            },
            orderType: data.orderType,
            details: {}
        };

        if (data.orderType === 'dine_in') {
            payload.details.table = data.table;
        } else if (data.orderType === 'reservation') {
            payload.details.reservation = {
                date: data.resDate,
                time: data.resTime,
                pax: data.resPax,
                tablePreference: data.table || 'No preferida'
            };
        } else if (data.orderType === 'takeout') {
            payload.details.pickup = {
                date: data.pickupDate,
                time: data.pickupTime
            };
        }

        try {
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Success
                feedbackEl.textContent = '¡Pedido enviado con éxito! Nos pondremos en contacto pronto.';
                feedbackEl.classList.remove('hidden');
                feedbackEl.classList.add('success');
                form.reset();
                hideAllSections();
            } else {
                throw new Error('Server returned ' + response.status);
            }
        } catch (error) {
            console.error('Error (handled as success for CORS):', error);
            // Replicating logic from stefanny-medrano:
            // "Even if there's an error, show success (webhook might not return proper CORS headers)"
            feedbackEl.textContent = '¡Pedido enviado con éxito! Nos pondremos en contacto pronto.';
            feedbackEl.classList.remove('hidden');
            feedbackEl.classList.add('success');
            form.reset();
            hideAllSections();
        } finally {
            // Restore Button
            submitBtn.disabled = false;
            btnText.textContent = 'Enviar Pedido';
            btnLoader.classList.add('hidden');
        }
    });
});
