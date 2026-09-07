import mongoose from 'mongoose';

const PosterSchema = new mongoose.Schema({
  title: { type: String, required: true },
  image_url: { type: String, required: true },
  link_url: { type: String },
  start_date: { type: String },
  end_date: { type: String },
  created_at: { type: Date, default: Date.now }
});

export const Poster = mongoose.model('Poster', PosterSchema);
export default Poster;
