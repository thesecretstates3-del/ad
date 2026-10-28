// Era definitions. `poly` values are rough [lon, lat] outlines; they are smoothed
// and intersected with real land so coastlines stay accurate. `countries`
// takes modern country names verbatim from Natural Earth.
// mood: neutral | happy | proud | angry | sad | surprised | sleepy
// Borders before 1858 are approximate, and everything after today is fiction.

export const LAND = ['India', 'Pakistan', 'Bangladesh', 'Nepal', 'Bhutan', 'Sri Lanka',
  'Afghanistan', 'Myanmar', 'Tajikistan', 'Uzbekistan', 'Turkmenistan'];

export const ERAS = [
  { year: -3000, name: 'Early Harappan Cultures', color: '#c9a25b', mood: 'sleepy',
    poly: [[66,25],[66.5,29.5],[69,32.5],[72,34],[74.5,32.5],[75.5,30],[73,27],[71,24.5],[69,23.5],[66,24.5]] },
  { year: -2600, name: 'Indus Valley Civilization', color: '#d8a548', mood: 'happy',
    poly: [[62.5,25],[66,30],[68.5,33.8],[71.5,34.8],[74.5,33.5],[77.5,31],[78.5,29],[77,27.5],[74.5,25.5],[73.5,23.5],[73,21],[70,20.5],[68,23]] },
  { year: -1900, name: 'Late Harappan Decline', color: '#a98a5a', mood: 'sad',
    poly: [[71.5,31.5],[74,32.5],[77,31],[78.5,29],[77,27.8],[74.5,28.5],[72.5,29.5]] },
  { year: -1500, name: 'Vedic Period', color: '#e08a3c', mood: 'neutral',
    poly: [[69.5,33.5],[72,35],[75,34],[78,31],[80,29],[82,27.5],[83,26],[80.5,25],[77,26],[74,28],[71,29],[69,31]] },
  { year: -600, name: 'Mahajanapadas', color: '#d9773a', mood: 'surprised',
    poly: [[70,34],[73,35],[76.5,32.5],[80,29.5],[84,27.6],[88,26.8],[88.5,24.5],[86,23],[83,23.5],[80,23],[77,22.5],[74,22],[72,23],[71,26],[69.5,29],[69,32]] },
  { year: -321, name: 'Maurya Empire', color: '#c4513a', mood: 'angry',
    poly: [[64,30],[66,34],[70,35.5],[74,35],[77,32],[80,29.5],[84,27.5],[88,27],[89.5,25.5],[89,21.5],[86,20],[82,19],[78,18],[74.5,17],[73,18],[70,20.5],[67,24],[63,25.5]] },
  { year: -250, name: 'Maurya Empire (Ashoka)', color: '#b8402f', mood: 'proud',
    poly: [[61.5,31.5],[62,34.8],[66,36],[70,36.5],[74,35.5],[77.5,32.5],[80.5,29.8],[84.5,27.6],[88.2,27.2],[90,26],[89.5,22],[86,19.5],[84,17],[82,16],[80.5,14.5],[78.5,12.8],[76,13],[74.5,14],[73,17],[70,20.5],[67,24],[62,25]] },
  { year: 100, name: 'Kushan Empire', color: '#7a5aa8', mood: 'angry',
    poly: [[61,30],[61.5,36],[65,38.5],[69,40],[73,39.5],[75,37],[76.5,34],[78,31],[80.5,28.5],[83.5,26.5],[84,25],[81,24.5],[78,25],[75,23],[72.5,22],[70,22.5],[67,24],[62,25]] },
  { year: 400, name: 'Gupta Empire', color: '#e0b43a', mood: 'happy',
    poly: [[67.5,24.5],[69.5,28.5],[72,31],[74.5,32.5],[77,31.5],[80,29.2],[84,27.5],[88.3,27],[92,26.5],[92.5,24],[90,22],[87,21],[85,20],[82.5,21.5],[80,21.5],[77,21.5],[74,21],[71,21],[68.5,23]] },
  { year: 640, name: 'Empire of Harsha', color: '#d0a050', mood: 'neutral',
    poly: [[73.5,31.5],[76,32.5],[78.5,31],[81,29],[84,27.5],[88,26.8],[89,24.5],[88,22],[86,21.5],[83,22],[80,23],[77,23.5],[75,25],[73.5,28]] },
  { year: 1030, name: 'Chola Empire', color: '#3f8f7a', mood: 'proud',
    poly: [[73.5,12],[74.5,15.5],[76,17.5],[78.5,19],[81,20],[83.5,19.5],[85.5,20.2],[88,21.5],[87.5,19],[84,16],[81.5,14],[80.5,10],[79,7.5],[77,7.8],[76,9.5],[74.8,12]],
    extra: [[[79.4,10.2],[82.6,10.2],[82.6,5.5],[79.4,5.5]]] },
  { year: 1206, name: 'Delhi Sultanate', color: '#2f7d4f', mood: 'angry',
    poly: [[69.5,31],[71.5,33],[74,33],[77,31.5],[80,29.5],[84,27.5],[88,26.8],[89.5,25],[88.8,23],[86,23.5],[83,24],[80,24],[77,24.5],[74,25],[71,26],[69,28]] },
  { year: 1335, name: 'Delhi Sultanate (Tughlaq)', color: '#276b43', mood: 'proud',
    poly: [[66,25],[67.5,29],[69.5,31.5],[71.5,33.5],[74.5,33.8],[77.5,31.5],[80.5,29.5],[84.5,27.6],[88.3,27],[91.5,26],[92,24],[89.5,22],[87,21],[85,19.5],[82.5,17],[80.5,14.5],[80,11],[79,9],[77.5,9],[76,11],[74.5,14],[73,17],[72.5,20],[70,21],[68,23]] },
  { year: 1526, name: 'Mughal Empire', color: '#3d8a4a', mood: 'surprised',
    poly: [[64,31],[65,34.5],[68,36],[71.5,36.5],[74,34.5],[76.5,32],[78.5,30],[80.5,28.5],[83.5,27],[84.5,25.5],[82,24.5],[79,24.8],[77,25.5],[75,27],[72.5,28.5],[70,29.5],[67,29.5]] },
  { year: 1707, name: 'Mughal Empire (Aurangzeb)', color: '#2e9a5a', mood: 'proud',
    poly: [[62,31],[63.5,35],[67,36.5],[71.5,36.8],[74.5,35],[77.5,32.5],[80.5,29.8],[84.5,27.6],[88.3,27],[91,26.5],[92.5,24.5],[92.2,22],[89,21.5],[86.5,20.5],[84.5,18.5],[82,16.5],[80.2,13.5],[79.5,11.5],[78,10.8],[76.5,11.5],[75,12.5],[74.2,15],[73,18],[72.5,20.5],[70,21],[67,24],[63,25.5]] },
  { year: 1760, name: 'Maratha Empire', color: '#e07a2c', mood: 'angry',
    poly: [[68.5,23],[70.5,25],[72,27],[74,30],[75.5,32],[77.5,30.8],[79,28.5],[80.5,26],[82.5,25],[84.5,23],[86.5,21.5],[85.5,19.5],[83,17],[80.5,15.5],[78.5,14.5],[76.5,14.2],[74.5,14.8],[73,17],[72.6,20],[70,21]] },
  { year: 1858, name: 'British Raj', color: '#c8303a', mood: 'sad',
    countries: ['India', 'Pakistan', 'Bangladesh'] },
  { year: 1886, name: 'British Raj + Burma', color: '#c8303a', mood: 'sad',
    countries: ['India', 'Pakistan', 'Bangladesh', 'Myanmar'] },
  { year: 1947, name: 'Independence of India', color: '#f08a24', mood: 'surprised',
    countries: ['India'],
    others: [{ name: 'Pakistan', color: '#2f7a45', countries: ['Pakistan', 'Bangladesh'], mood: 'neutral' }] },
  { year: 1971, name: 'Republic of India', color: '#f08a24', mood: 'proud',
    countries: ['India'],
    others: [
      { name: 'Pakistan', color: '#2f7a45', countries: ['Pakistan'], mood: 'sad' },
      { name: 'Bangladesh', color: '#1f8a6a', countries: ['Bangladesh'], mood: 'happy' }] },
  { year: 2026, name: 'Republic of India', color: '#f39a2b', mood: 'happy',
    countries: ['India'] },
  { year: 2150, name: 'South Asian Union', color: '#e8a030', mood: 'happy', future: true,
    countries: ['India', 'Nepal', 'Bhutan', 'Bangladesh', 'Sri Lanka'] },
  { year: 2800, name: 'Greater Bharat Federation', color: '#d9573a', mood: 'proud', future: true,
    countries: ['India', 'Nepal', 'Bhutan', 'Bangladesh', 'Sri Lanka', 'Pakistan', 'Myanmar', 'Afghanistan'] },
  { year: 6000, name: 'Age of Rising Seas', color: '#4a8fb0', mood: 'sad', future: true,
    countries: ['India', 'Nepal', 'Bhutan', 'Bangladesh', 'Sri Lanka', 'Pakistan', 'Myanmar', 'Afghanistan'],
    // Low-lying coasts that go under water in this fictional scenario.
    cut: [
      [[86.5,21.6],[88.5,22.8],[90.5,23.6],[92.4,22.8],[92.5,20],[86,20]],
      [[67,25.2],[69.5,24.4],[71,24],[71,23.3],[69.3,22.4],[66,22.5]],
      [[93.8,17],[95,17.4],[96.5,17],[97.2,16],[94,15]],
      [[71.8,22.6],[72.8,22.9],[73.3,21.6],[72,20.8]]] },
  { year: 10000, name: 'The Subcontinent, Year 10000', color: '#8a5ad0', mood: 'surprised', future: true,
    countries: ['India', 'Nepal', 'Bhutan', 'Bangladesh', 'Sri Lanka', 'Pakistan', 'Myanmar', 'Afghanistan'],
    // Falling seas reconnect Sri Lanka to the mainland.
    extra: [[[78.9,9.75],[80.2,9.9],[80.15,9.0],[79.9,8.6],[79.1,9.1]]] },
];
