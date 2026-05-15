type CityTabsProps = {
  cities: string[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
};

export function CityTabs({ cities, selectedCity, onSelectCity }: CityTabsProps) {
  return (
    <nav className="city-tabs" aria-label="Filtrer par ville">
      {cities.map((city) => (
        <button
          key={city}
          className={city === selectedCity ? 'active' : ''}
          onClick={() => onSelectCity(city)}
          type="button"
        >
          {city}
        </button>
      ))}
    </nav>
  );
}
