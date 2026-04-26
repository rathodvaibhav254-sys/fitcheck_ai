const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Load data from JSON files
let outfits = [];
let savedLooks = [];

try {
  outfits = JSON.parse(fs.readFileSync(path.join(__dirname, 'outfits.json'), 'utf8'));
  savedLooks = JSON.parse(fs.readFileSync(path.join(__dirname, 'saved.json'), 'utf8'));
} catch (error) {
  console.error('Error loading data files:', error);
}

// API: Get outfits (with optional filters)
app.get('/api/outfits', (req, res) => {
  try {
    const { occ, g, s } = req.query;

    let filteredOutfits = [...outfits];

    if (occ || g || s) {
      const targetOcc = occ || 'all';
      const targetG = g || 'unisex';
      const targetS = s || 'all';

      filteredOutfits = filteredOutfits.filter(o => {
        let mOcc = (targetOcc === 'all' || o.occ === targetOcc);
        let mG = (targetG === 'unisex' || o.g === 'unisex' || o.g === targetG);
        let mS = (targetS === 'all' || o.s === 'all' || o.s === targetS);
        return mOcc && mG && mS;
      });

      // fallback to just occasion
      if (filteredOutfits.length === 0 && targetOcc !== 'all') {
        const fallbackOutfits = outfits.filter(o => o.occ === targetOcc);
        filteredOutfits = fallbackOutfits.slice(0, 6);
      }
    }

    res.json(filteredOutfits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch outfits' });
  }
});

// API: Get saved looks
app.get('/api/saved', (req, res) => {
  try {
    res.json(savedLooks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch saved looks' });
  }
});

// API: Save a look
app.post('/api/saved', (req, res) => {
  try {
    const { outfitId } = req.body;
    if (!savedLooks.includes(outfitId)) {
      savedLooks.push(outfitId);
      fs.writeFileSync(path.join(__dirname, 'saved.json'), JSON.stringify(savedLooks, null, 2));
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save look' });
  }
});

// API: Remove saved look
app.delete('/api/saved/:id', (req, res) => {
  try {
    const { id } = req.params;
    savedLooks = savedLooks.filter(savedId => savedId !== id);
    fs.writeFileSync(path.join(__dirname, 'saved.json'), JSON.stringify(savedLooks, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove saved look' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

// API: Get saved look IDs
app.get('/api/saved', async (req, res) => {
  try {
    const saved = await prisma.savedLook.findMany();
    res.json(saved.map(s => s.outfitId));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch saved looks' });
  }
});

// API: Save an outfit
app.post('/api/saved', async (req, res) => {
  try {
    const { outfitId } = req.body;
    if (!outfitId) return res.status(400).json({ error: 'outfitId required' });
    
    const saved = await prisma.savedLook.create({
      data: { outfitId }
    });
    res.json(saved);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Outfit already saved' });
    }
    res.status(500).json({ error: 'Failed to save outfit' });
  }
});

// API: Remove a saved outfit
app.delete('/api/saved/:outfitId', async (req, res) => {
  try {
    const { outfitId } = req.params;
    await prisma.savedLook.delete({
      where: { outfitId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete saved outfit' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
