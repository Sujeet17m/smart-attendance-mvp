import { MapPin, CheckCircle, XCircle } from 'lucide-react';

export default function LocationStatus({ location }) {
  const isVerified = location !== null;

  return (
    <div className={`card ${isVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${isVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
          <MapPin size={24} className={isVerified ? 'text-green-600' : 'text-yellow-600'} />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 flex items-center">
            {isVerified ? (
              <>
                <CheckCircle size={18} className="text-green-600 mr-2" />
                Location Verified
              </>
            ) : (
              <>
                <XCircle size={18} className="text-yellow-600 mr-2" />
                Location Not Available
              </>
            )}
          </h3>
          <p className="text-sm text-gray-600">
            {isVerified
              ? `Lat: ${location.latitude.toFixed(4)}, Lng: ${location.longitude.toFixed(4)}`
              : 'Enable location services for geofence validation'}
          </p>
        </div>
      </div>
    </div>
  );
}