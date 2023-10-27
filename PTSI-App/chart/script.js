// document.getElementById('csvFile').addEventListener('change', handleFile);

// function handleFile(event) {
//     const file = event.target.files[0];
//     const reader = new FileReader();

//     reader.onload = function(e) {
//         const content = e.target.result;
//         const data = parseCSV(content);
//         renderChart(data);
//     }

//     reader.readAsText(file);
// }

// function parseCSV(csv) {
//     const lines = csv.split('\n');
//     const result = [];
//     const headers = lines[0].split(',');

//     for(let i = 1; i < lines.length; i++) {
//         const obj = {};
//         const currentline = lines[i].split(',');

//         for(let j = 0; j < headers.length; j++){
//             obj[headers[j]] = currentline[j];
//         }

//         result.push(obj);
//     }

//     return result;
// }

// function renderChart(data) {
//     const labels = data.map(item => item.日付);
//     const values = data.map(item => parseInt(item.売上));

//     const ctx = document.getElementById('chartContainer').getContext('2d');
    
//     new Chart(ctx, {
//         type: 'line',
//         data: {
//             labels: labels,
//             datasets: [{
//                 label: '売上',
//                 data: values,
//                 backgroundColor: 'rgba(75, 192, 192, 0.2)',
//                 borderColor: 'rgba(75, 192, 192, 1)',
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             scales: {
//                 y: {
//                     beginAtZero: true
//                 }
//             }
//         }
//     });
// }
