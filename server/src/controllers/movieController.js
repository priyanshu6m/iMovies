import mongoose from 'mongoose';
import Movie from '../models/Movie.js';

/**
 * @desc    Get all movies with filters, search, sorting, and pagination
 * @route   GET /api/movies
 * @access  Public
 */
export const getMovies = async (req, res, next) => {
  try {
    const {
      search,
      genre,
      language,
      status,
      trending,
      minRating,
      sort = '-rating',
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Filter by status (default hides inactive unless explicitly requested)
    if (status) {
      if (['now_showing', 'upcoming', 'inactive'].includes(status)) {
        filter.status = status;
      }
    } else {
      filter.status = { $ne: 'inactive' };
    }

    // Filter by trending flag
    if (trending !== undefined) {
      filter.trending = trending === 'true' || trending === true;
    }

    // Filter by genre
    if (genre) {
      const genres = Array.isArray(genre) ? genre : genre.split(',').map((g) => g.trim());
      filter.genre = { $in: genres.map((g) => new RegExp(`^${g}$`, 'i')) };
    }

    // Filter by language
    if (language) {
      const langs = Array.isArray(language) ? language : language.split(',').map((l) => l.trim());
      filter.language = { $in: langs.map((l) => new RegExp(`^${l}$`, 'i')) };
    }

    // Filter by minRating
    if (minRating) {
      const parsedRating = parseFloat(minRating);
      if (!isNaN(parsedRating)) {
        filter.rating = { $gte: parsedRating };
      }
    }

    // Search query (matches title, cast, director, description)
    if (search && search.trim()) {
      const regex = new RegExp(search.trim().replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      filter.$or = [
        { title: regex },
        { director: regex },
        { cast: regex },
        { description: regex },
        { genre: regex },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build sorting map
    let sortOption = {};
    if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === '-rating') sortOption = { rating: -1 };
    else if (sort === 'rating_asc') sortOption = { rating: 1 };
    else if (sort === 'title' || sort === 'title_asc') sortOption = { title: 1 };
    else if (sort === '-title' || sort === 'title_desc') sortOption = { title: -1 };
    else if (sort === 'release' || sort === '-releaseDate') sortOption = { releaseDate: -1 };
    else if (sort === 'release_asc' || sort === 'releaseDate') sortOption = { releaseDate: 1 };
    else if (sort === 'price_asc') sortOption = { price: 1 };
    else if (sort === 'price_desc') sortOption = { price: -1 };
    else sortOption = { rating: -1 };

    const total = await Movie.countDocuments(filter);
    const movies = await Movie.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      movies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single movie by ID
 * @route   GET /api/movies/:id
 * @access  Public
 */
export const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format',
      });
    }

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    res.status(200).json({
      success: true,
      movie,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new movie (Admin only)
 * @route   POST /api/movies
 * @access  Private/Admin
 */
export const createMovie = async (req, res, next) => {
  try {
    const {
      title,
      description,
      poster,
      backdrop,
      genre,
      language,
      duration,
      releaseDate,
      certificate,
      cast,
      director,
      trailerUrl,
      rating,
      votes,
      price,
      trending,
      status,
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a movie title',
      });
    }

    const effectivePoster = poster && poster.trim() 
      ? poster.trim() 
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80';
    
    const effectiveBackdrop = backdrop && backdrop.trim()
      ? backdrop.trim()
      : effectivePoster;

    const formattedGenres = Array.isArray(genre)
      ? genre
      : typeof genre === 'string'
      ? genre.split(',').map((g) => g.trim()).filter(Boolean)
      : ['Action', 'Drama'];

    const formattedCast = Array.isArray(cast)
      ? cast
      : typeof cast === 'string'
      ? cast.split(',').map((c) => c.trim()).filter(Boolean)
      : ['Lead Actor'];

    const effectiveDescription = description && description.trim()
      ? description.trim()
      : `${title.trim()} delivers an immersive cinematic experience with compelling drama, stunning visuals, and powerful performances.`;

    const effectiveDuration = duration && duration.trim() ? duration.trim() : '2h 15m';
    const effectiveRelease = releaseDate && releaseDate.trim() ? releaseDate.trim() : new Date().toISOString().split('T')[0];
    const effectiveLanguage = language && language.trim() ? language.trim() : 'English';
    const effectiveDirector = director && director.trim() ? director.trim() : 'Acclaimed Director';

    const movie = await Movie.create({
      title: title.trim(),
      description: effectiveDescription,
      poster: effectivePoster,
      backdrop: effectiveBackdrop,
      genre: formattedGenres.length > 0 ? formattedGenres : ['Cinema'],
      language: effectiveLanguage,
      duration: effectiveDuration,
      releaseDate: effectiveRelease,
      certificate: certificate || 'UA',
      cast: formattedCast,
      director: effectiveDirector,
      trailerUrl: trailerUrl ? trailerUrl.trim() : '',
      rating: rating !== undefined ? Number(rating) : 8.0,
      votes: votes ? String(votes) : '12.5k',
      price: price !== undefined ? Number(price) : 250,
      trending: Boolean(trending),
      status: status || 'now_showing',
    });

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      movie,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a movie by ID (Admin only)
 * @route   PATCH /api/movies/:id
 * @access  Private/Admin
 */
export const updateMovie = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format',
      });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const updates = { ...req.body };

    // Format genres if supplied as comma-separated string
    if (updates.genre && typeof updates.genre === 'string') {
      updates.genre = updates.genre.split(',').map((g) => g.trim()).filter(Boolean);
    }
    // Format cast if supplied as comma-separated string
    if (updates.cast && typeof updates.cast === 'string') {
      updates.cast = updates.cast.split(',').map((c) => c.trim()).filter(Boolean);
    }

    const updatedMovie = await Movie.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Movie updated successfully',
      movie: updatedMovie,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete or deactivate a movie (Admin only)
 * @route   DELETE /api/movies/:id
 * @access  Private/Admin
 */
export const deleteMovie = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { soft } = req.query; // If soft=true, set status='inactive', otherwise remove

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format',
      });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    if (soft === 'true') {
      movie.status = 'inactive';
      await movie.save();
      return res.status(200).json({
        success: true,
        message: 'Movie deactivated successfully',
        movie,
      });
    }

    await Movie.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Movie deleted successfully',
      id,
    });
  } catch (error) {
    next(error);
  }
};
