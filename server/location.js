/**
 * Location utilities – metro area groupings + zip radius lookup
 */
const axios = require('axios');

// Major metro areas → surrounding cities
const METRO_AREAS = {
  'houston':       ['sugar land', 'the woodlands', 'katy', 'pearland', 'league city', 'pasadena', 'baytown', 'conroe', 'friendswood', 'missouri city', 'humble', 'spring', 'cypress', 'richmond'],
  'dallas':        ['fort worth', 'arlington', 'plano', 'garland', 'irving', 'frisco', 'mckinney', 'denton', 'richardson', 'lewisville', 'carrollton', 'allen', 'mesquite', 'grand prairie'],
  'austin':        ['round rock', 'cedar park', 'pflugerville', 'georgetown', 'kyle', 'buda', 'san marcos', 'leander', 'manor'],
  'san antonio':   ['new braunfels', 'schertz', 'converse', 'universal city', 'boerne', 'seguin', 'helotes'],
  'new york':      ['brooklyn', 'queens', 'bronx', 'jersey city', 'newark', 'yonkers', 'stamford', 'hoboken'],
  'los angeles':   ['long beach', 'anaheim', 'santa ana', 'glendale', 'pasadena', 'torrance', 'pomona', 'el monte', 'burbank', 'irvine', 'santa monica', 'culver city'],
  'chicago':       ['aurora', 'rockford', 'joliet', 'naperville', 'evanston', 'schaumburg', 'elgin', 'waukegan', 'cicero'],
  'phoenix':       ['mesa', 'chandler', 'scottsdale', 'glendale', 'gilbert', 'tempe', 'peoria', 'surprise', 'goodyear'],
  'philadelphia':  ['camden', 'wilmington', 'trenton', 'norristown', 'chester', 'allentown'],
  'san diego':     ['chula vista', 'el cajon', 'escondido', 'santee', 'la mesa', 'oceanside', 'carlsbad'],
  'denver':        ['aurora', 'lakewood', 'thornton', 'arvada', 'westminster', 'centennial', 'highlands ranch', 'boulder', 'littleton'],
  'seattle':       ['bellevue', 'tacoma', 'redmond', 'kirkland', 'renton', 'kent', 'everett', 'federal way'],
  'portland':      ['beaverton', 'hillsboro', 'gresham', 'lake oswego', 'tigard', 'vancouver'],
  'miami':         ['fort lauderdale', 'boca raton', 'pompano beach', 'coral springs', 'west palm beach', 'deerfield beach', 'hialeah'],
  'atlanta':       ['sandy springs', 'roswell', 'alpharetta', 'marietta', 'smyrna', 'dunwoody', 'johns creek', 'brookhaven'],
  'nashville':     ['murfreesboro', 'franklin', 'brentwood', 'smyrna', 'hendersonville', 'spring hill'],
  'charlotte':     ['concord', 'gastonia', 'rock hill', 'huntersville', 'matthews', 'mooresville'],
  'las vegas':     ['henderson', 'north las vegas', 'paradise', 'enterprise', 'summerlin'],
  'minneapolis':   ['saint paul', 'bloomington', 'plymouth', 'brooklyn park', 'maple grove', 'eden prairie'],
  'boston':        ['cambridge', 'worcester', 'quincy', 'brockton', 'lowell', 'newton', 'somerville', 'lynn'],
};

// Haversine distance in miles between two lat/lon points
function distanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Top US cities with coordinates for radius lookup
const US_CITIES = [
  { city: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060 },
  { city: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
  { city: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
  { city: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
  { city: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740 },
  { city: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
  { city: 'San Antonio', state: 'TX', lat: 29.4241, lon: -98.4936 },
  { city: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
  { city: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.7970 },
  { city: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
  { city: 'Jacksonville', state: 'FL', lat: 30.3322, lon: -81.6557 },
  { city: 'Fort Worth', state: 'TX', lat: 32.7555, lon: -97.3308 },
  { city: 'Columbus', state: 'OH', lat: 39.9612, lon: -82.9988 },
  { city: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
  { city: 'Indianapolis', state: 'IN', lat: 39.7684, lon: -86.1581 },
  { city: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
  { city: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
  { city: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
  { city: 'Nashville', state: 'TN', lat: 36.1627, lon: -86.7816 },
  { city: 'Oklahoma City', state: 'OK', lat: 35.4676, lon: -97.5164 },
  { city: 'El Paso', state: 'TX', lat: 31.7619, lon: -106.4850 },
  { city: 'Washington', state: 'DC', lat: 38.9072, lon: -77.0369 },
  { city: 'Las Vegas', state: 'NV', lat: 36.1699, lon: -115.1398 },
  { city: 'Louisville', state: 'KY', lat: 38.2527, lon: -85.7585 },
  { city: 'Memphis', state: 'TN', lat: 35.1495, lon: -90.0490 },
  { city: 'Portland', state: 'OR', lat: 45.5051, lon: -122.6750 },
  { city: 'Baltimore', state: 'MD', lat: 39.2904, lon: -76.6122 },
  { city: 'Milwaukee', state: 'WI', lat: 43.0389, lon: -87.9065 },
  { city: 'Albuquerque', state: 'NM', lat: 35.0844, lon: -106.6504 },
  { city: 'Tucson', state: 'AZ', lat: 32.2226, lon: -110.9747 },
  { city: 'Fresno', state: 'CA', lat: 36.7378, lon: -119.7871 },
  { city: 'Sacramento', state: 'CA', lat: 38.5816, lon: -121.4944 },
  { city: 'Mesa', state: 'AZ', lat: 33.4152, lon: -111.8315 },
  { city: 'Kansas City', state: 'MO', lat: 39.0997, lon: -94.5786 },
  { city: 'Atlanta', state: 'GA', lat: 33.7490, lon: -84.3880 },
  { city: 'Omaha', state: 'NE', lat: 41.2565, lon: -95.9345 },
  { city: 'Colorado Springs', state: 'CO', lat: 38.8339, lon: -104.8214 },
  { city: 'Raleigh', state: 'NC', lat: 35.7796, lon: -78.6382 },
  { city: 'Long Beach', state: 'CA', lat: 33.7701, lon: -118.1937 },
  { city: 'Virginia Beach', state: 'VA', lat: 36.8529, lon: -75.9780 },
  { city: 'Minneapolis', state: 'MN', lat: 44.9778, lon: -93.2650 },
  { city: 'Tampa', state: 'FL', lat: 27.9506, lon: -82.4572 },
  { city: 'New Orleans', state: 'LA', lat: 29.9511, lon: -90.0715 },
  { city: 'Arlington', state: 'TX', lat: 32.7357, lon: -97.1081 },
  { city: 'Bakersfield', state: 'CA', lat: 35.3733, lon: -119.0187 },
  { city: 'Honolulu', state: 'HI', lat: 21.3069, lon: -157.8583 },
  { city: 'Anaheim', state: 'CA', lat: 33.8353, lon: -117.9145 },
  { city: 'Aurora', state: 'CO', lat: 39.7294, lon: -104.8319 },
  { city: 'Santa Ana', state: 'CA', lat: 33.7455, lon: -117.8677 },
  { city: 'Corpus Christi', state: 'TX', lat: 27.8006, lon: -97.3964 },
  { city: 'Riverside', state: 'CA', lat: 33.9533, lon: -117.3962 },
  { city: 'Lexington', state: 'KY', lat: 38.0406, lon: -84.5037 },
  { city: 'St. Louis', state: 'MO', lat: 38.6270, lon: -90.1994 },
  { city: 'Pittsburgh', state: 'PA', lat: 40.4406, lon: -79.9959 },
  { city: 'Anchorage', state: 'AK', lat: 61.2181, lon: -149.9003 },
  { city: 'Stockton', state: 'CA', lat: 37.9577, lon: -121.2908 },
  { city: 'Cincinnati', state: 'OH', lat: 39.1031, lon: -84.5120 },
  { city: 'St. Paul', state: 'MN', lat: 44.9537, lon: -93.0900 },
  { city: 'Toledo', state: 'OH', lat: 41.6528, lon: -83.5379 },
  { city: 'Greensboro', state: 'NC', lat: 36.0726, lon: -79.7920 },
  { city: 'Newark', state: 'NJ', lat: 40.7357, lon: -74.1724 },
  { city: 'Plano', state: 'TX', lat: 33.0198, lon: -96.6989 },
  { city: 'Henderson', state: 'NV', lat: 36.0395, lon: -114.9817 },
  { city: 'Lincoln', state: 'NE', lat: 40.8136, lon: -96.7026 },
  { city: 'Buffalo', state: 'NY', lat: 42.8864, lon: -78.8784 },
  { city: 'Fort Wayne', state: 'IN', lat: 41.1306, lon: -85.1289 },
  { city: 'Jersey City', state: 'NJ', lat: 40.7178, lon: -74.0431 },
  { city: 'Chandler', state: 'AZ', lat: 33.3062, lon: -111.8413 },
  { city: 'St. Petersburg', state: 'FL', lat: 27.7676, lon: -82.6403 },
  { city: 'Laredo', state: 'TX', lat: 27.5306, lon: -99.4803 },
  { city: 'Norfolk', state: 'VA', lat: 36.8508, lon: -76.2859 },
  { city: 'Madison', state: 'WI', lat: 43.0731, lon: -89.4012 },
  { city: 'Durham', state: 'NC', lat: 35.9940, lon: -78.8986 },
  { city: 'Lubbock', state: 'TX', lat: 33.5779, lon: -101.8552 },
  { city: 'Winston-Salem', state: 'NC', lat: 36.0999, lon: -80.2442 },
  { city: 'Garland', state: 'TX', lat: 32.9126, lon: -96.6389 },
  { city: 'Glendale', state: 'AZ', lat: 33.5387, lon: -112.1860 },
  { city: 'Hialeah', state: 'FL', lat: 25.8576, lon: -80.2781 },
  { city: 'Reno', state: 'NV', lat: 39.5296, lon: -119.8138 },
  { city: 'Baton Rouge', state: 'LA', lat: 30.4515, lon: -91.1871 },
  { city: 'Irvine', state: 'CA', lat: 33.6846, lon: -117.8265 },
  { city: 'Chesapeake', state: 'VA', lat: 36.7682, lon: -76.2875 },
  { city: 'Irving', state: 'TX', lat: 32.8140, lon: -96.9489 },
  { city: 'Scottsdale', state: 'AZ', lat: 33.4942, lon: -111.9261 },
  { city: 'North Las Vegas', state: 'NV', lat: 36.1989, lon: -115.1175 },
  { city: 'Fremont', state: 'CA', lat: 37.5485, lon: -121.9886 },
  { city: 'Gilbert', state: 'AZ', lat: 33.3528, lon: -111.7890 },
  { city: 'San Bernardino', state: 'CA', lat: 34.1083, lon: -117.2898 },
  { city: 'Birmingham', state: 'AL', lat: 33.5186, lon: -86.8104 },
  { city: 'Rochester', state: 'NY', lat: 43.1566, lon: -77.6088 },
  { city: 'Richmond', state: 'VA', lat: 37.5407, lon: -77.4360 },
  { city: 'Spokane', state: 'WA', lat: 47.6588, lon: -117.4260 },
  { city: 'Des Moines', state: 'IA', lat: 41.5868, lon: -93.6250 },
  { city: 'Montgomery', state: 'AL', lat: 32.3668, lon: -86.2999 },
  { city: 'Modesto', state: 'CA', lat: 37.6391, lon: -120.9969 },
  { city: 'Fayetteville', state: 'NC', lat: 35.0527, lon: -78.8784 },
  { city: 'Tacoma', state: 'WA', lat: 47.2529, lon: -122.4443 },
  { city: 'Shreveport', state: 'LA', lat: 32.5252, lon: -93.7502 },
  { city: 'Akron', state: 'OH', lat: 41.0814, lon: -81.5190 },
  { city: 'Aurora', state: 'IL', lat: 41.7606, lon: -88.3201 },
  { city: 'Yonkers', state: 'NY', lat: 40.9312, lon: -73.8988 },
  { city: 'Huntington Beach', state: 'CA', lat: 33.6595, lon: -117.9988 },
  { city: 'Little Rock', state: 'AR', lat: 34.7465, lon: -92.2896 },
  { city: 'Glendale', state: 'CA', lat: 34.1425, lon: -118.2551 },
  { city: 'Columbus', state: 'GA', lat: 32.4610, lon: -84.9877 },
  { city: 'Grand Rapids', state: 'MI', lat: 42.9634, lon: -85.6681 },
  { city: 'Amarillo', state: 'TX', lat: 35.2220, lon: -101.8313 },
  { city: 'Oxnard', state: 'CA', lat: 34.1975, lon: -119.1771 },
  { city: 'Tallahassee', state: 'FL', lat: 30.4518, lon: -84.2807 },
  { city: 'Huntsville', state: 'AL', lat: 34.7304, lon: -86.5861 },
  { city: 'Worcester', state: 'MA', lat: 42.2626, lon: -71.8023 },
  { city: 'Knoxville', state: 'TN', lat: 35.9606, lon: -83.9207 },
  { city: 'Newport News', state: 'VA', lat: 36.9787, lon: -76.4300 },
  { city: 'Providence', state: 'RI', lat: 41.8240, lon: -71.4128 },
  { city: 'Brownsville', state: 'TX', lat: 25.9017, lon: -97.4975 },
  { city: 'Santa Clarita', state: 'CA', lat: 34.3917, lon: -118.5426 },
  { city: 'Garden Grove', state: 'CA', lat: 33.7743, lon: -117.9378 },
  { city: 'Oceanside', state: 'CA', lat: 33.1959, lon: -117.3795 },
  { city: 'Fort Lauderdale', state: 'FL', lat: 26.1224, lon: -80.1373 },
  { city: 'Salt Lake City', state: 'UT', lat: 40.7608, lon: -111.8910 },
  { city: 'Tempe', state: 'AZ', lat: 33.4255, lon: -111.9400 },
  { city: 'Chattanooga', state: 'TN', lat: 35.0456, lon: -85.3097 },
  { city: 'Ontario', state: 'CA', lat: 34.0633, lon: -117.6509 },
  { city: 'Vancouver', state: 'WA', lat: 45.6387, lon: -122.6615 },
  { city: 'Elk Grove', state: 'CA', lat: 38.4088, lon: -121.3716 },
  { city: 'Peoria', state: 'AZ', lat: 33.5806, lon: -112.2374 },
  { city: 'Murfreesboro', state: 'TN', lat: 35.8456, lon: -86.3903 },
  { city: 'Frisco', state: 'TX', lat: 33.1507, lon: -96.8236 },
  { city: 'Overland Park', state: 'KS', lat: 38.9822, lon: -94.6708 },
  { city: 'McKinney', state: 'TX', lat: 33.1972, lon: -96.6397 },
  { city: 'Grand Prairie', state: 'TX', lat: 32.7460, lon: -96.9978 },
];

/**
 * Resolve a zip code or city string to { city, state, lat, lon, cityLower }
 */
async function resolveLocation(input) {
  if (!input) return null;
  input = input.trim();

  if (/^\d{5}$/.test(input)) {
    try {
      const res = await axios.get(`https://api.zippopotam.us/us/${input}`, { timeout: 5000 });
      const place = res.data?.places?.[0];
      if (!place) return null;
      return {
        city:      place['place name'],
        state:     place['state abbreviation'],
        cityLower: place['place name'].toLowerCase(),
        lat:       parseFloat(place['latitude']),
        lon:       parseFloat(place['longitude']),
      };
    } catch { return null; }
  }

  const match = input.match(/^([^,]+),?\s+([A-Za-z]{2})$/);
  if (match) {
    const city  = match[1].trim();
    const state = match[2].toUpperCase();
    const known = US_CITIES.find(c => c.city.toLowerCase() === city.toLowerCase() && c.state === state);
    return { city, state, cityLower: city.toLowerCase(), lat: known?.lat || null, lon: known?.lon || null };
  }

  const known = US_CITIES.find(c => c.city.toLowerCase() === input.toLowerCase());
  if (known) {
    return { city: known.city, state: known.state, cityLower: known.city.toLowerCase(), lat: known.lat, lon: known.lon };
  }

  return { city: input, state: '', cityLower: input.toLowerCase(), lat: null, lon: null };
}

/**
 * Get surrounding cities within radiusMiles of the given location.
 * Uses metro area groupings first, then falls back to coordinate-based lookup.
 */
function getNearbyCities(loc, radiusMiles = 100) {
  const nearby = new Set();

  // Metro area groupings (fast, no math needed)
  const metro = METRO_AREAS[loc.cityLower];
  if (metro) metro.forEach(c => nearby.add(c));

  // Coordinate-based lookup (catches cities not in metro groups)
  if (loc.lat && loc.lon) {
    for (const c of US_CITIES) {
      if (c.city.toLowerCase() === loc.cityLower) continue;
      const dist = distanceMiles(loc.lat, loc.lon, c.lat, c.lon);
      if (dist <= radiusMiles) {
        nearby.add(c.city.toLowerCase());
      }
    }
  }

  return [...nearby];
}

module.exports = { resolveLocation, getNearbyCities, METRO_AREAS };
