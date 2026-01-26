import { useState } from "react";
import {
  ArrowLeft,
  MapPin,
  Home,
  Briefcase,
  Dumbbell,
  GraduationCap,
  Coffee,
  ShoppingBag,
  Heart,
  Users,
  Plus,
  Clock,
  Navigation,
  Pencil,
  Trash2,
  Check,
  X,
  Car,
  Building2,
  Church,
  Utensils,
} from "lucide-react";
import { IOSStatusBar } from "../components/IOSStatusBar";

interface SavedPlacesScreenProps {
  onNavigate?: (screen: string) => void;
}

interface SavedPlace {
  id: string;
  name: string;
  label: string;
  address: string;
  icon: string;
  color: string;
  eta?: string;
  distance?: string;
  visitCount: number;
  lastVisit?: string;
}

const PLACE_ICONS: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  home: { icon: <Home className="w-5 h-5" />, color: "text-blue-600", bg: "bg-blue-100" },
  work: { icon: <Briefcase className="w-5 h-5" />, color: "text-violet-600", bg: "bg-violet-100" },
  gym: { icon: <Dumbbell className="w-5 h-5" />, color: "text-orange-600", bg: "bg-orange-100" },
  school: { icon: <GraduationCap className="w-5 h-5" />, color: "text-emerald-600", bg: "bg-emerald-100" },
  cafe: { icon: <Coffee className="w-5 h-5" />, color: "text-amber-600", bg: "bg-amber-100" },
  shopping: { icon: <ShoppingBag className="w-5 h-5" />, color: "text-pink-600", bg: "bg-pink-100" },
  doctor: { icon: <Heart className="w-5 h-5" />, color: "text-red-600", bg: "bg-red-100" },
  family: { icon: <Users className="w-5 h-5" />, color: "text-teal-600", bg: "bg-teal-100" },
  parking: { icon: <Car className="w-5 h-5" />, color: "text-slate-600", bg: "bg-slate-100" },
  office: { icon: <Building2 className="w-5 h-5" />, color: "text-indigo-600", bg: "bg-indigo-100" },
  church: { icon: <Church className="w-5 h-5" />, color: "text-purple-600", bg: "bg-purple-100" },
  restaurant: { icon: <Utensils className="w-5 h-5" />, color: "text-rose-600", bg: "bg-rose-100" },
  other: { icon: <MapPin className="w-5 h-5" />, color: "text-gray-600", bg: "bg-gray-100" },
};

export function SavedPlacesScreen({ onNavigate }: SavedPlacesScreenProps) {
  const [places, setPlaces] = useState<SavedPlace[]>([
    {
      id: "1",
      name: "Home",
      label: "home",
      address: "123 Oak Street, Apt 4B",
      icon: "home",
      color: "blue",
      eta: "12 min",
      distance: "4.2 mi",
      visitCount: 156,
      lastVisit: "Today",
    },
    {
      id: "2",
      name: "Work",
      label: "work",
      address: "456 Business Park, Suite 200",
      icon: "work",
      color: "violet",
      eta: "25 min",
      distance: "8.7 mi",
      visitCount: 89,
      lastVisit: "Today",
    },
    {
      id: "3",
      name: "Equinox Gym",
      label: "gym",
      address: "789 Fitness Ave",
      icon: "gym",
      color: "orange",
      eta: "8 min",
      distance: "2.1 mi",
      visitCount: 34,
      lastVisit: "Yesterday",
    },
    {
      id: "4",
      name: "Mom's House",
      label: "family",
      address: "321 Family Lane",
      icon: "family",
      color: "teal",
      eta: "45 min",
      distance: "18.3 mi",
      visitCount: 12,
      lastVisit: "Last week",
    },
    {
      id: "5",
      name: "Blue Bottle Coffee",
      label: "cafe",
      address: "555 Brew Street",
      icon: "cafe",
      color: "amber",
      eta: "5 min",
      distance: "0.8 mi",
      visitCount: 28,
      lastVisit: "2 days ago",
    },
  ]);

  const [isAddingPlace, setIsAddingPlace] = useState(false);
  const [editingPlace, setEditingPlace] = useState<string | null>(null);
  const [newPlace, setNewPlace] = useState({
    name: "",
    address: "",
    icon: "other",
  });

  const handleAddPlace = () => {
    if (newPlace.name && newPlace.address) {
      const place: SavedPlace = {
        id: Date.now().toString(),
        name: newPlace.name,
        label: newPlace.icon,
        address: newPlace.address,
        icon: newPlace.icon,
        color: PLACE_ICONS[newPlace.icon]?.color || "gray",
        visitCount: 0,
      };
      setPlaces([...places, place]);
      setNewPlace({ name: "", address: "", icon: "other" });
      setIsAddingPlace(false);
    }
  };

  const handleDeletePlace = (id: string) => {
    setPlaces(places.filter((p) => p.id !== id));
  };

  const iconOptions = Object.keys(PLACE_ICONS);

  return (
    <div className="min-h-screen bg-ios-bg pb-28">
      <IOSStatusBar />

      {/* Header */}
      <div className="px-5 pt-2 pb-3">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => onNavigate?.("settings")}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <p className="text-[12px] text-slate-500 font-medium">Your Places</p>
            <h1 className="text-[24px] font-bold text-slate-900 tracking-tight">
              Saved Locations
            </h1>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="px-5 mb-4">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-4 text-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[15px] mb-1">Smart Locations</h3>
              <p className="text-[13px] text-white/80 leading-relaxed">
                MYPA uses your saved places to give you real-time ETAs based on
                traffic. Say "How long to the gym?" and I'll know exactly where
                you mean.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick ETAs */}
      <div className="px-5 mb-4">
        <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Current ETAs
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          {places.slice(0, 4).map((place) => {
            const iconData = PLACE_ICONS[place.icon] || PLACE_ICONS.other;
            return (
              <div
                key={place.id}
                className="flex-shrink-0 bg-white rounded-xl p-3 shadow-sm min-w-[100px]"
              >
                <div
                  className={`w-8 h-8 rounded-lg ${iconData.bg} flex items-center justify-center mb-2`}
                >
                  <span className={iconData.color}>{iconData.icon}</span>
                </div>
                <p className="text-[12px] text-slate-500 truncate">{place.name}</p>
                <p className="text-[16px] font-bold text-slate-900">
                  {place.eta || "--"}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Saved Places List */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide">
            All Places
          </h3>
          <button
            onClick={() => setIsAddingPlace(true)}
            className="flex items-center gap-1 text-violet-600 text-[13px] font-medium"
          >
            <Plus className="w-4 h-4" />
            Add Place
          </button>
        </div>

        {/* Add Place Form */}
        {isAddingPlace && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-3 border-2 border-violet-200">
            <h4 className="font-semibold text-[15px] text-slate-900 mb-3">
              Add New Place
            </h4>

            {/* Icon Selection */}
            <div className="mb-3">
              <label className="text-[12px] text-slate-500 font-medium mb-2 block">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((iconKey) => {
                  const iconData = PLACE_ICONS[iconKey];
                  return (
                    <button
                      key={iconKey}
                      onClick={() =>
                        setNewPlace({ ...newPlace, icon: iconKey })
                      }
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                        newPlace.icon === iconKey
                          ? `${iconData.bg} ring-2 ring-violet-500`
                          : "bg-slate-100"
                      }`}
                    >
                      <span
                        className={
                          newPlace.icon === iconKey
                            ? iconData.color
                            : "text-slate-400"
                        }
                      >
                        {iconData.icon}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name Input */}
            <div className="mb-3">
              <label className="text-[12px] text-slate-500 font-medium mb-1 block">
                Name
              </label>
              <input
                type="text"
                value={newPlace.name}
                onChange={(e) =>
                  setNewPlace({ ...newPlace, name: e.target.value })
                }
                placeholder="e.g., LA Fitness, Starbucks on Main"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Address Input */}
            <div className="mb-4">
              <label className="text-[12px] text-slate-500 font-medium mb-1 block">
                Address
              </label>
              <input
                type="text"
                value={newPlace.address}
                onChange={(e) =>
                  setNewPlace({ ...newPlace, address: e.target.value })
                }
                placeholder="Enter full address"
                className="w-full px-4 py-3 rounded-xl bg-slate-100 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsAddingPlace(false);
                  setNewPlace({ name: "", address: "", icon: "other" });
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-[15px] active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPlace}
                disabled={!newPlace.name || !newPlace.address}
                className="flex-1 py-3 rounded-xl bg-violet-600 text-white font-medium text-[15px] active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
              >
                Save Place
              </button>
            </div>
          </div>
        )}

        {/* Places */}
        <div className="space-y-2">
          {places.map((place) => {
            const iconData = PLACE_ICONS[place.icon] || PLACE_ICONS.other;
            return (
              <div
                key={place.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl ${iconData.bg} flex items-center justify-center`}
                  >
                    <span className={iconData.color}>{iconData.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-[15px] text-slate-900 truncate">
                        {place.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDeletePlace(place.id)}
                          className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[13px] text-slate-500 truncate mb-2">
                      {place.address}
                    </p>
                    <div className="flex items-center gap-4">
                      {place.eta && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-violet-500" />
                          <span className="text-[12px] text-slate-600">
                            {place.eta}
                          </span>
                        </div>
                      )}
                      {place.distance && (
                        <div className="flex items-center gap-1">
                          <Navigation className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-[12px] text-slate-600">
                            {place.distance}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[12px] text-slate-400">
                          {place.visitCount} visits
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Understanding Section */}
      <div className="px-5 mt-6">
        <h3 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-3">
          How MYPA Uses This
        </h3>
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[14px]">💬</span>
              </div>
              <div>
                <p className="text-[13px] text-slate-600">
                  <span className="font-medium text-slate-900">"How long to the gym?"</span>
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  → I'll check traffic to Equinox Gym and give you the ETA
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[14px]">🚗</span>
              </div>
              <div>
                <p className="text-[13px] text-slate-600">
                  <span className="font-medium text-slate-900">"When should I leave for work?"</span>
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  → I'll factor in traffic and your meeting time
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <span className="text-[14px]">📍</span>
              </div>
              <div>
                <p className="text-[13px] text-slate-600">
                  <span className="font-medium text-slate-900">"Remind me when I get to mom's"</span>
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  → Location-based reminder at Mom's House
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="px-5 mt-4 mb-8">
        <div className="bg-slate-100 rounded-xl p-3">
          <p className="text-[12px] text-slate-500 text-center">
            💡 The more places you save, the smarter MYPA becomes at understanding your routine
          </p>
        </div>
      </div>
    </div>
  );
}
