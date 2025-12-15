function hoursFromNow (hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export async function seedDemoDataIfEmpty (db) {
  const hallsCollection = db.collection('halls');
  const showsCollection = db.collection('shows');
  const reservationsCollection = db.collection('reservations');

  const hallsCount = await hallsCollection.countDocuments();
  const showsCount = await showsCollection.countDocuments();
  const reservationsCount = await reservationsCollection.countDocuments();

  if (hallsCount > 0 && showsCount > 0) {
    return;
  }

  let halls = [];

  if (hallsCount === 0) {
    await hallsCollection.insertMany([
      { name: 'Saal 1', rows: 8, seatsPerRow: 12 },
      { name: 'Saal 2', rows: 10, seatsPerRow: 16 }
    ]);
  }

  halls = await hallsCollection.find({}).sort({ name: 1 }).toArray();

  if (showsCount === 0) {
    const primaryHall = halls[0];
    const secondaryHall = halls[1] || halls[0];

    await showsCollection.insertMany([
      {
        startsAt: hoursFromNow(2),
        hallId: primaryHall._id,
        movieTitle: 'Inception'
      },
      {
        startsAt: hoursFromNow(5),
        hallId: secondaryHall._id,
        movieTitle: 'Interstellar'
      },
      {
        startsAt: hoursFromNow(26),
        hallId: primaryHall._id,
        movieTitle: 'The Dark Knight'
      }
    ]);
  }

  if (reservationsCount === 0) {
    const shows = await showsCollection.find({}).sort({ startsAt: 1 }).toArray();
    if (shows.length > 0 && halls.length > 0) {
      const show = shows[0];
      const hall = halls.find(h => String(h._id) === String(show.hallId)) || halls[0];

      const maxRow = Math.max(1, Math.min(2, hall.rows));
      const maxSeat = Math.max(1, Math.min(4, hall.seatsPerRow));

      const seatCodes = [];
      for (let row = 1; row <= maxRow; row += 1) {
        for (let seat = 1; seat <= maxSeat; seat += 1) {
          seatCodes.push(`${row}:${seat}`);
        }
      }

      await reservationsCollection.insertOne({
        showId: show._id,
        customerName: 'Demo Kunde',
        seatCodes,
        createdAt: new Date()
      });
    }
  }

  console.log('Demo-Daten: Seed abgeschlossen (falls DB leer war).');
}
