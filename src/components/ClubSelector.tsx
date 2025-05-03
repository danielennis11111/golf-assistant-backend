import React, { useState, useEffect } from 'react';
import './ClubSelector.css';

interface ClubRecommendation {
  club: string;
  shotType: string;
  reasoning: string;
  timestamp: number;
}

interface UserProfile {
  gender: string;
  age: number;
  skillLevel: string;
}

const ClubSelector: React.FC = () => {
  const [isNavOpen, setIsNavOpen] = useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const savedProfile = localStorage.getItem('golfProfile');
    return savedProfile ? JSON.parse(savedProfile) : {
      gender: 'male',
      age: '',
      skillLevel: 'average'
    };
  });
  const [distance, setDistance] = useState<string>('');
  const [terrain, setTerrain] = useState<string>('fairway');
  const [elevation, setElevation] = useState<number>(0);
  const [windSpeed, setWindSpeed] = useState<number>(0);
  const [windDirection, setWindDirection] = useState<string>('none');
  const [recommendation, setRecommendation] = useState<ClubRecommendation | null>(null);

  // Save profile to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('golfProfile', JSON.stringify(profile));
  }, [profile]);

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const getClubRecommendation = (): ClubRecommendation => {
    // Base club selection logic based on distance
    let recommendedClub = '7 Iron';
    let recommendedShotType = 'straight';
    let reasoning = '';

    // Convert distance to number
    const rawDistance = Number(distance) || 0;
    
    // Base club selection with more realistic ranges
    if (terrain === 'bunker') {
      if (rawDistance < 25) {
        recommendedClub = 'Sand Wedge';
        recommendedShotType = 'bunker-shot';
        reasoning += 'In bunker, use sand wedge for very short distance. Open the clubface and aim for the ball to land 5-10 yards short of the target. Use a bunker shot technique with a full swing.';
      } else if (rawDistance < 45) {
        recommendedClub = 'Gap Wedge';
        recommendedShotType = 'bunker-shot';
        reasoning += 'In bunker, use gap wedge for short distance. Open the clubface and aim for the ball to land 10-15 yards short of the target. Use a bunker shot technique with a full swing.';
      } else {
        recommendedClub = 'Pitching Wedge';
        recommendedShotType = 'bunker-shot';
        reasoning += 'In bunker, use pitching wedge for longer distance. Open the clubface and aim for the ball to land 15-20 yards short of the target. Use a bunker shot technique with a full swing.';
      }
    } else if (terrain === 'rough') {
      if (rawDistance < 15) {
        recommendedClub = 'Putter';
        recommendedShotType = 'putt';
        reasoning += 'Very short distance from rough, use putter if possible. Account for green slope and aim for the ball to roll to the target.';
      } else if (rawDistance < 30) {
        recommendedClub = 'Lob Wedge';
        recommendedShotType = 'flop-shot';
        reasoning += 'Short distance from rough, use lob wedge for a flop shot. Open the clubface, take a full swing, and aim for the ball to land 5-10 yards short of the target.';
      } else if (rawDistance < 45) {
        recommendedClub = 'Sand Wedge';
        recommendedShotType = 'pitch-shot';
        reasoning += 'Short distance from rough, use sand wedge for a pitch shot. Take a 3/4 swing and aim for the ball to land 10-15 yards short of the target.';
      } else if (rawDistance < 60) {
        recommendedClub = 'Gap Wedge';
        recommendedShotType = 'pitch-shot';
        reasoning += 'Short-medium distance from rough, use gap wedge for a pitch shot. Take a 3/4 swing and aim for the ball to land 15-20 yards short of the target.';
      } else if (rawDistance < 75) {
        recommendedClub = 'Pitching Wedge';
        recommendedShotType = 'punch-shot';
        reasoning += 'Medium distance from rough, use pitching wedge for a punch shot. Take a 3/4 swing with hands forward and aim for the ball to land 20-25 yards short of the target.';
      } else if (rawDistance < 90) {
        recommendedClub = '9 Iron';
        recommendedShotType = 'punch-shot';
        reasoning += 'Medium distance from rough, use 9 iron for a punch shot. Take a 3/4 swing with hands forward and aim for the ball to land 25-30 yards short of the target.';
      } else if (rawDistance < 105) {
        recommendedClub = '8 Iron';
        recommendedShotType = 'punch-shot';
        reasoning += 'Medium distance from rough, use 8 iron for a punch shot. Take a 3/4 swing with hands forward and aim for the ball to land 30-35 yards short of the target.';
      } else if (rawDistance < 120) {
        recommendedClub = '7 Iron';
        recommendedShotType = 'punch-shot';
        reasoning += 'Medium-long distance from rough, use 7 iron for a punch shot. Take a 3/4 swing with hands forward and aim for the ball to land 35-40 yards short of the target.';
      } else if (rawDistance < 135) {
        recommendedClub = '6 Iron';
        recommendedShotType = 'punch-shot';
        reasoning += 'Long distance from rough, use 6 iron for a punch shot. Take a 3/4 swing with hands forward and aim for the ball to land 40-45 yards short of the target.';
      } else if (rawDistance < 150) {
        recommendedClub = '5 Iron';
        recommendedShotType = 'punch-shot';
        reasoning += 'Long distance from rough, use 5 iron for a punch shot. Take a 3/4 swing with hands forward and aim for the ball to land 45-50 yards short of the target.';
      } else if (rawDistance < 165) {
        recommendedClub = '4 Iron';
        recommendedShotType = 'punch-shot';
        reasoning += 'Long distance from rough, use 4 iron for a punch shot. Take a 3/4 swing with hands forward and aim for the ball to land 50-55 yards short of the target.';
      } else if (rawDistance < 180) {
        recommendedClub = '3 Iron';
        recommendedShotType = 'punch-shot';
        reasoning += 'Long distance from rough, use 3 iron for a punch shot. Take a 3/4 swing with hands forward and aim for the ball to land 55-60 yards short of the target.';
      } else {
        recommendedClub = 'Pitching Wedge (Consider layup)';
        recommendedShotType = 'chip-shot';
        reasoning += 'Extreme distance from rough, consider a layup shot with pitching wedge. Use a chip shot technique and aim for the ball to land 20-25 yards short of the target.';
      }
    } else if (rawDistance < 15) {
      recommendedClub = 'Putter';
      recommendedShotType = 'putt';
      reasoning += 'Very short distance, perfect for a putter. Account for green slope and aim for the ball to roll to the target.';
    } else if (rawDistance < 25) {
      recommendedClub = 'Lob Wedge';
      recommendedShotType = 'flop-shot';
      reasoning += 'Extremely short distance, ideal for a flop shot with lob wedge. Open the clubface, take a full swing, and aim for the ball to land 5-10 yards short of the target.';
    } else if (rawDistance < 40) {
      recommendedClub = 'Sand Wedge';
      recommendedShotType = 'chip-shot';
      reasoning += 'Very short distance, perfect for a chip shot with sand wedge. Take a 1/2 swing and aim for the ball to land 10-15 yards short of the target.';
    } else if (rawDistance < 55) {
      recommendedClub = 'Gap Wedge';
      recommendedShotType = 'pitch-shot';
      reasoning += 'Short distance, good for a pitch shot with gap wedge. Take a 3/4 swing and aim for the ball to land 15-20 yards short of the target.';
    } else if (rawDistance < 70) {
      recommendedClub = 'Pitching Wedge';
      recommendedShotType = 'pitch-shot';
      reasoning += 'Short-medium distance, perfect for a pitch shot with pitching wedge. Take a 3/4 swing and aim for the ball to land 20-25 yards short of the target.';
    } else if (rawDistance < 85) {
      recommendedClub = '9 Iron';
      recommendedShotType = 'full-shot';
      reasoning += 'Medium-short distance, ideal for a full shot with 9 iron. Take a full swing and aim for the ball to land 25-30 yards short of the target.';
    } else if (rawDistance < 100) {
      recommendedClub = '8 Iron';
      recommendedShotType = 'full-shot';
      reasoning += 'Medium distance, good for a full shot with 8 iron. Take a full swing and aim for the ball to land 30-35 yards short of the target.';
    } else if (rawDistance < 115) {
      recommendedClub = '7 Iron';
      recommendedShotType = 'full-shot';
      reasoning += 'Medium-long distance, standard full shot with 7 iron. Take a full swing and aim for the ball to land 35-40 yards short of the target.';
    } else if (rawDistance < 130) {
      recommendedClub = '6 Iron';
      recommendedShotType = 'full-shot';
      reasoning += 'Long distance, requires a full shot with 6 iron. Take a full swing and aim for the ball to land 40-45 yards short of the target.';
    } else if (rawDistance < 145) {
      recommendedClub = '5 Iron';
      recommendedShotType = 'full-shot';
      reasoning += 'Very long distance, best with a full shot with 5 iron. Take a full swing and aim for the ball to land 45-50 yards short of the target.';
    } else if (rawDistance < 160) {
      recommendedClub = '4 Iron';
      recommendedShotType = 'full-shot';
      reasoning += 'Long distance, best with a full shot with 4 iron. Take a full swing and aim for the ball to land 50-55 yards short of the target.';
    } else if (rawDistance < 175) {
      recommendedClub = '3 Iron';
      recommendedShotType = 'full-shot';
      reasoning += 'Very long distance, best with a full shot with 3 iron. Take a full swing and aim for the ball to land 55-60 yards short of the target.';
    } else if (rawDistance < 190) {
      recommendedClub = '3 Wood';
      recommendedShotType = 'full-shot';
      reasoning += 'Maximum fairway wood distance, perfect for a full shot with 3 wood. Take a full swing and aim for the ball to land 60-70 yards short of the target.';
    } else if (rawDistance < 250) {
      recommendedClub = 'Driver';
      recommendedShotType = 'full-shot';
      reasoning += 'Maximum distance, best with a full shot with driver. Take a full swing and aim for the ball to land 70-80 yards short of the target.';
    } else {
      recommendedClub = 'Driver (Consider layup)';
      recommendedShotType = 'full-shot';
      reasoning += 'Extreme distance, consider a layup shot with driver. Take a full swing and aim for the ball to land 80-90 yards short of the target.';
    }

    // Add terrain-specific roll instructions
    if (terrain === 'rough') {
      reasoning += ' In rough, expect less roll after landing.';
    } else if (terrain === 'fairway') {
      reasoning += ' On fairway, expect normal roll after landing.';
    }

    // Add elevation-specific roll instructions
    if (elevation) {
      const elevationChange = Number(elevation);
      if (elevationChange > 0) {
        reasoning += ` Uphill shot - expect less roll after landing.`;
      } else if (elevationChange < 0) {
        reasoning += ` Downhill shot - expect more roll after landing.`;
      }
    }

    // Add wind-specific roll instructions
    if (windSpeed) {
      const speed = Number(windSpeed);
      if (windDirection === 'headwind') {
        reasoning += ` ${speed} mph headwind - expect less roll after landing.`;
      } else if (windDirection === 'tailwind') {
        reasoning += ` ${speed} mph tailwind - expect more roll after landing.`;
      }
    }

    // Add wind-specific shot type adjustments
    if (windSpeed) {
      const speed = Number(windSpeed);
      if (windDirection === 'headwind') {
        recommendedShotType = 'punch-shot';
        reasoning += ` Use a punch shot to combat ${speed} mph headwind.`;
      } else if (windDirection === 'tailwind') {
        recommendedShotType = 'high-shot';
        reasoning += ` Use a high shot to maximize ${speed} mph tailwind.`;
      } else if (windDirection === 'crosswind') {
        recommendedShotType = 'punch-shot';
        reasoning += ` Use a punch shot to minimize ${speed} mph crosswind effect.`;
      }
    }

    // Add elevation-specific shot type adjustments
    if (elevation) {
      const elevationChange = Number(elevation);
      if (elevationChange > 0) {
        recommendedShotType = 'high-shot';
        reasoning += ` Use a high shot for ${elevationChange} feet uphill.`;
      } else if (elevationChange < 0) {
        recommendedShotType = 'punch-shot';
        reasoning += ` Use a punch shot for ${Math.abs(elevationChange)} feet downhill.`;
      }
    }

    // Remove hybrid recommendations
    // Apply adjustments to club selection
    let clubAdjustment = 0;

    // Gender adjustment
    if (profile.gender === 'female') {
      clubAdjustment += 1; // Women typically need one club more
      reasoning += ' Female golfer - consider using one club more.';
    }

    // Age adjustment
    if (profile.age) {
      const age = Number(profile.age);
      if (age > 50) {
        const ageAdjustment = Math.min(2, Math.floor((age - 50) / 10)); // One club per decade over 50, max 2 clubs
        clubAdjustment += ageAdjustment;
        reasoning += ` Age ${age} - consider using ${ageAdjustment} club${ageAdjustment > 1 ? 's' : ''} more.`;
      }
    }

    // Skill level adjustment
    if (profile.skillLevel === 'beginner') {
      clubAdjustment += 1; // Beginners typically need one club more
      reasoning += ' Beginner skill level - consider using one club more.';
    } else if (profile.skillLevel === 'advanced') {
      clubAdjustment -= 1; // Advanced players typically need one club less
      reasoning += ' Advanced skill level - consider using one club less.';
    }

    // Terrain adjustment
    if (terrain === 'rough') {
      clubAdjustment += 1; // Rough typically requires one club more
      reasoning += ' Rough terrain - consider using one club more.';
    } else if (terrain === 'bunker') {
      clubAdjustment += 1; // Bunker typically requires one club more
      reasoning += ' Bunker - consider using one club more.';
    }

    // Elevation adjustment
    if (elevation) {
      const elevationChange = Number(elevation);
      if (elevationChange > 0) {
        const elevationClubs = Math.min(2, Math.floor(elevationChange / 15)); // One club per 15 feet uphill, max 2 clubs
        clubAdjustment -= elevationClubs;
        reasoning += ` Uphill ${elevationChange} feet - consider using ${elevationClubs} club${elevationClubs > 1 ? 's' : ''} less.`;
      } else if (elevationChange < 0) {
        const elevationClubs = Math.min(2, Math.floor(Math.abs(elevationChange) / 15)); // One club per 15 feet downhill, max 2 clubs
        clubAdjustment += elevationClubs;
        reasoning += ` Downhill ${Math.abs(elevationChange)} feet - consider using ${elevationClubs} club${elevationClubs > 1 ? 's' : ''} more.`;
      }
    }

    // Wind adjustment
    if (windSpeed) {
      const speed = Number(windSpeed);
      if (windDirection === 'headwind') {
        const windClubs = Math.min(2, Math.floor(speed / 10)); // One club per 10 mph headwind, max 2 clubs
        clubAdjustment += windClubs;
        reasoning += ` ${speed} mph headwind - consider using ${windClubs} club${windClubs > 1 ? 's' : ''} more.`;
      } else if (windDirection === 'tailwind') {
        const windClubs = Math.min(2, Math.floor(speed / 15)); // One club per 15 mph tailwind, max 2 clubs
        clubAdjustment -= windClubs;
        reasoning += ` ${speed} mph tailwind - consider using ${windClubs} club${windClubs > 1 ? 's' : ''} less.`;
      }
    }

    // Shot type adjustment
    switch (recommendedShotType) {
      case 'high-straight':
      case 'high-fade':
      case 'high-draw':
        clubAdjustment -= 1;
        reasoning += ` ${recommendedShotType} shot - consider using one club less.`;
        break;
      case 'low-straight':
      case 'low-fade':
      case 'low-draw':
        clubAdjustment += 1;
        reasoning += ` ${recommendedShotType} shot - consider using one club more.`;
        break;
      case 'punch':
        clubAdjustment += 2;
        reasoning += ' Punch shot - consider using two clubs more.';
        break;
    }

    return {
      club: recommendedClub,
      shotType: recommendedShotType,
      reasoning,
      timestamp: Date.now()
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecommendation = getClubRecommendation();
    setRecommendation(newRecommendation);
  };

  return (
    <div className="club-selector">
      <nav className="main-nav">
        <button 
          className="nav-toggle"
          onClick={() => setIsNavOpen(!isNavOpen)}
        >
          {isNavOpen ? '▼' : '▶'} User Settings
        </button>
        
        {isNavOpen && (
          <div className="nav-content">
            <div className="form-group">
              <label htmlFor="gender">Gender:</label>
              <select
                id="gender"
                value={profile.gender}
                onChange={(e) => handleProfileChange('gender', e.target.value)}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="age">Age:</label>
              <input
                type="number"
                id="age"
                value={profile.age}
                onChange={(e) => handleProfileChange('age', Number(e.target.value))}
                min="18"
                max="100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="skillLevel">Skill Level:</label>
              <select
                id="skillLevel"
                value={profile.skillLevel}
                onChange={(e) => handleProfileChange('skillLevel', e.target.value)}
              >
                <option value="beginner">Beginner</option>
                <option value="average">Average</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        )}
      </nav>

      <form onSubmit={handleSubmit} className="input-form">
        <h2>Shot Details</h2>
        <div className="form-group">
          <label htmlFor="distance">Distance (yards):</label>
          <input
            type="number"
            id="distance"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            min="10"
            max="400"
            placeholder="Enter distance (yards)"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="terrain">Terrain:</label>
          <select
            id="terrain"
            value={terrain}
            onChange={(e) => setTerrain(e.target.value)}
          >
            <option value="fairway">Fairway</option>
            <option value="rough">Rough</option>
            <option value="bunker">Bunker</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="elevation">Elevation Change (feet):</label>
          <input
            type="number"
            id="elevation"
            value={elevation}
            onChange={(e) => setElevation(Number(e.target.value))}
            min="-50"
            max="50"
          />
        </div>

        <div className="form-group">
          <label htmlFor="windSpeed">Wind Speed (mph):</label>
          <input
            type="number"
            id="windSpeed"
            value={windSpeed}
            onChange={(e) => setWindSpeed(Number(e.target.value))}
            min="0"
            max="30"
          />
        </div>

        <div className="form-group">
          <label htmlFor="windDirection">Wind Direction:</label>
          <select
            id="windDirection"
            value={windDirection}
            onChange={(e) => setWindDirection(e.target.value)}
          >
            <option value="none">None</option>
            <option value="headwind">Headwind</option>
            <option value="tailwind">Tailwind</option>
            <option value="crosswind">Crosswind</option>
          </select>
        </div>

        <button type="submit" className="submit-button">
          Get Club Recommendation
        </button>
      </form>

      {recommendation && (
        <div className="recommendation">
          <h2>Recommended Club: {recommendation.club}</h2>
          <h3>Recommended Shot: {recommendation.shotType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h3>
          <p>{recommendation.reasoning}</p>
        </div>
      )}
    </div>
  );
};

export default ClubSelector; 