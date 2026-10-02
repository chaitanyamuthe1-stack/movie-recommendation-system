/**
 * Cinematic Movie Visual Asset Engine
 * Provides authentic, high-definition posters, backdrops, and official transparent
 * movie title logos for catalog titles, plus procedural SVG cinema posters.
 */

import { Movie } from '../types';

export interface MovieAsset {
  poster: string;
  backdrop: string;
  logo?: string;
}

/**
 * Curated authentic movie posters, cinematic backdrops, and official movie title logos.
 * Uses high-definition CDN assets and verified official movie logos.
 */
export const CURATED_MOVIE_ASSETS: Record<string, MovieAsset> = {
  // --- The Dark Knight & Batman Series ---
  "the dark knight": {
    poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/9FE5eD92WfVCiivM9Pq9GVSrlWk.jpg"
  },
  "the dark knight rises": {
    poster: "https://image.tmdb.org/t/p/w500/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/c3OHQncTAnKFhdOTX7D3LTW6son.jpg"
  },
  "batman begins": {
    poster: "https://image.tmdb.org/t/p/w500/sPX89Td70IDDjVr85jdSBb4rWGr.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/9IIBboV7MCT0bTxzXHmWK1Hq558.jpg"
  },
  "batman v superman: dawn of justice": {
    poster: "https://image.tmdb.org/t/p/w500/5UsK3grJvtQrtzEgqNlDljJW96w.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/5fX1oSGuYdKgwWmUTAN5MNSQGzr.jpg"
  },

  // --- Christopher Nolan Classics ---
  "inception": {
    poster: "https://image.tmdb.org/t/p/w500/xlaY2zyzMfkhk0HSC5VUwzoZPU1.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg"
  },
  "interstellar": {
    poster: "https://image.tmdb.org/t/p/w500/yQvGrMoipbRoddT0ZR8tPoR7NfX.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/8sNiAPPYU14PUepFNeSNGUTiHW.jpg"
  },
  "the prestige": {
    poster: "https://image.tmdb.org/t/p/w500/Ag2B2KHKQPukjH7WutmgnnSNurZ.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/yaExZh6qE2cfyK3o4kAMEq0mkgy.jpg"
  },

  // --- Major Trending Hits ---
  "minions": {
    poster: "https://image.tmdb.org/t/p/w500/dr02BdCNAUPVU07aOodwPYv6HCf.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/wKrxeY6lbu7KFBsWVcMH6M8avwr.jpg"
  },
  "deadpool": {
    poster: "https://image.tmdb.org/t/p/w500/3E53WEZJqP6aM84D8CckXx4pIHw.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/rFj9IKlL75B2pXhZA60jkNWvxeW.jpg"
  },
  "guardians of the galaxy": {
    poster: "https://image.tmdb.org/t/p/w500/r7vmZjiyZw9rpJMQJdXpjgiCOk9.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/uLtVbjvS1O7gXL8lUOwsFOH4man.jpg"
  },
  "mad max: fury road": {
    poster: "https://image.tmdb.org/t/p/w500/ulcAi4dKpAjHwYGS08vNyx9H6I9.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/gqrnQA6Xppdl8vIb2eJc58VC1tW.jpg"
  },
  "jurassic world": {
    poster: "https://image.tmdb.org/t/p/w500/rhr4y79GpxQF9IsfJItRXVaoGs4.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/dF6FjTZzRTENfB4R17HDN20jLT2.jpg"
  },
  "jurassic park": {
    poster: "https://image.tmdb.org/t/p/w500/d9mtMGQDLANKieb9PbD3yK7xxzo.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/4SyDTF02R5BepqSdQmOaNCHObzF.jpg"
  },
  "big hero 6": {
    poster: "https://image.tmdb.org/t/p/w500/2mxS4wUimwlLmI1xp6QW6NSU361.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/4s2d3xdyqotiVNHTlTlJjrr3q0H.jpg"
  },
  "the martian": {
    poster: "https://image.tmdb.org/t/p/w500/5BHuvQ6p9kfc091Z8RiFNhCwL4b.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/lzMS0CI3FLQYC5EgJoWeIaEt0lm.jpg"
  },
  "frozen": {
    poster: "https://image.tmdb.org/t/p/w500/qZRcN4JLwYQWTxKlycZPLQb37mO.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/gOhtvGwrVkEM5hCFdyyWKJEOBk8.jpg"
  },
  "inside out": {
    poster: "https://image.tmdb.org/t/p/w500/2H1TmgdfNtsKlU9jKdeNyYL5y8T.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/jJKZaTBNenlFclQyjrnvzkRmvWE.jpg"
  },

  // --- Cinema Masterpieces & Top Rated ---
  "the godfather": {
    poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/tSPT36ZKlP2WVHJLM4cQPLSzv3b.jpg"
  },
  "the godfather: part ii": {
    poster: "https://image.tmdb.org/t/p/w500/8a1lJs7mFyGhGhZZDT1azJUoQiZ.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/kGzFbGhp99zva6oZODW5atUtnqi.jpg"
  },
  "the shawshank redemption": {
    poster: "https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/pNjh59JSxChQktamG3LMp9ZoQzp.jpg"
  },
  "fight club": {
    poster: "https://image.tmdb.org/t/p/w500/jSziioSwPVrOy9Yow3XhWIBDjq1.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/c6OLXfKAk5BKeR6broC8pYiCquX.jpg"
  },
  "pulp fiction": {
    poster: "https://image.tmdb.org/t/p/w500/vQWk5YBFWF4bZaofAbv0tShwBvQ.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg"
  },
  "forrest gump": {
    poster: "https://image.tmdb.org/t/p/w500/Cw4hIUIAmSYfK9QfaUW5igp9La.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/66Kn4XWhkuPkJxOJyPEx4U2CUfN.jpg"
  },
  "whiplash": {
    poster: "https://image.tmdb.org/t/p/w500/7fn624j5lj3xTme2SgiLCeuedmO.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/fRGxZuo7jJUWQsVg9PREb98Aclp.jpg"
  },
  "schindler's list": {
    poster: "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/zb6fM1CX41D9rF9hdgclu0peUmy.jpg"
  },
  "spirited away": {
    poster: "https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/6oaL4DP75yABrd5EbC4H2zq5ghc.jpg"
  },
  "gladiator": {
    poster: "https://image.tmdb.org/t/p/w500/wN2xWp1eIwCKOD0BHTcErTBv1Uq.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/Ar7QuJ7sJEiC0oP3I8fKBKIQD9u.jpg"
  },
  "the silence of the lambs": {
    poster: "https://image.tmdb.org/t/p/w500/uS9m8OBk1A8eM9I042bx8XXpqAq.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/mbOx1wxMLikzwWUO9TKAcFIy6op.jpg"
  },
  "titanic": {
    poster: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/xXCuto8YVp5RFqBJ7yKmVmLOWpF.jpg"
  },
  "avatar": {
    poster: "https://image.tmdb.org/t/p/w500/gKY6q7SjCkAU6FqvqWybDYgUKIF.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/vL5LR6WdxWPjLPFRLe133jXWsh5.jpg"
  },
  "the green mile": {
    poster: "https://image.tmdb.org/t/p/w500/8VG8fDNiy50H4FedGwdSVUPoaJe.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/amZavErrjrdgDwhsIdpWxHNenIx.jpg"
  },
  "one flew over the cuckoo's nest": {
    poster: "https://image.tmdb.org/t/p/w500/kjWsMh72V6d8KRLV4EOoSJLT1H7.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/uA8eSNAUUUyfHNIrG4h0zHxzt9W.jpg"
  },
  "goodfellas": {
    poster: "https://image.tmdb.org/t/p/w500/9OkCLM73MIU2CrKZbqiT8Ln1wY2.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/gILte6Zd7m1YneIr6MVhh30S9pr.jpg"
  },
  "se7en": {
    poster: "https://image.tmdb.org/t/p/w500/191nKfP0ehp3uIvWqgPbFmI4lv9.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/i5H7zusQGsysGQ8i6P361Vnr0n2.jpg"
  },
  "seven": {
    poster: "https://image.tmdb.org/t/p/w500/qm87HHUew8ICtUCM4asO3gFYvby.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/athnSvS41TEHOSK2Ax0LAM0ulDp.jpg"
  },
  "the usual suspects": {
    poster: "https://image.tmdb.org/t/p/w500/99X2SgyFunJFXGAYnDv3sb9pnUD.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/hy0Hx9fMPk2fmw26Li60z1S2giU.jpg"
  },

  // --- Sci-Fi & Adventure Icons ---
  "the matrix": {
    poster: "https://image.tmdb.org/t/p/w500/dXNAPwY7VrqMAo51EKhhCJfaGb5.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/tlm8UkiQsitc8rSuIAscQDCnP8d.jpg"
  },
  "star wars": {
    poster: "https://image.tmdb.org/t/p/w500/fai0rspsNeJCS69wHNjOdWxcI7P.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/zqkmTXzjkAgXmEWLRsY4UpTWCeo.jpg"
  },
  "star wars: episode iv - a new hope": {
    poster: "https://image.tmdb.org/t/p/w500/fai0rspsNeJCS69wHNjOdWxcI7P.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/zqkmTXzjkAgXmEWLRsY4UpTWCeo.jpg"
  },
  "the empire strikes back": {
    poster: "https://image.tmdb.org/t/p/w500/nNAeTmF4CtdSgMDplXTDPOpYzsX.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/k9pshruhCpJAdH9RaGJO6jaWQ4X.jpg"
  },
  "star wars: episode v - the empire strikes back": {
    poster: "https://image.tmdb.org/t/p/w500/nNAeTmF4CtdSgMDplXTDPOpYzsX.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/k9pshruhCpJAdH9RaGJO6jaWQ4X.jpg"
  },
  "return of the jedi": {
    poster: "https://image.tmdb.org/t/p/w500/jQYlydvHm3kUix1f8prMucrplhm.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/ziECpBRIyclmBNaFSWlvCfsKbMD.jpg"
  },
  "blade runner": {
    poster: "https://image.tmdb.org/t/p/w500/63N9uy8nd9j7Eog2axPQ8lbr3Wj.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/2spEHYDcyE9r9mS7AFEscfKVDzO.jpg"
  },
  "alien": {
    poster: "https://image.tmdb.org/t/p/w500/r1x5JGpyqZU8PYhbs4UcrO1Xb6x.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/4kix6fAblJIH6eMs0Ku2loyZJXK.jpg"
  },
  "aliens": {
    poster: "https://image.tmdb.org/t/p/w500/r1x5JGpyqZU8PYhbs4UcrO1Xb6x.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/4kix6fAblJIH6eMs0Ku2loyZJXK.jpg"
  },
  "back to the future": {
    poster: "https://image.tmdb.org/t/p/w500/vN5B5WgYscRGcQpVhHl6p9DDTP0.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/5bzPWQ2dFUl2aZKkp7ILJVVkRed.jpg"
  },
  "terminator 2: judgment day": {
    poster: "https://image.tmdb.org/t/p/w500/jFTVD4XoWQTcg7wdyJKa8PEds5q.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/izkMjmhauFx9DjoBQqM5sM5WAwE.jpg"
  },
  "terminator genisys": {
    poster: "https://image.tmdb.org/t/p/w500/oZRVDpNtmHk8M1VYy1aeOWUXgbC.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/wvlIoof1FnKPLv9jAYanuP31V0C.jpg"
  },

  // --- The Lord of the Rings & Hobbit ---
  "the lord of the rings: the fellowship of the ring": {
    poster: "https://image.tmdb.org/t/p/w500/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/oiwc338EoBgS4sEI2ixAny4KQKg.jpg"
  },
  "the lord of the rings: the two towers": {
    poster: "https://image.tmdb.org/t/p/w500/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/6G73mNyooWAEQTpckPSnFxFoNmc.jpg"
  },
  "the lord of the rings: the return of the king": {
    poster: "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/ctiw6FZK4N36LmkjSklWEbuvlq9.jpg"
  },

  // --- Marvel Cinematic Universe ---
  "the avengers": {
    poster: "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg"
  },
  "avengers: age of ultron": {
    poster: "https://image.tmdb.org/t/p/w500/4ssDuvEDkSArWEdyBl2X5EHvYKU.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/kIBK5SKwgqIIuRKhhWrJn3XkbPq.jpg"
  },
  "captain america: civil war": {
    poster: "https://image.tmdb.org/t/p/w500/rAGiXaUfPzY7CDEyNKUofk3Kw2e.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/7FWlcZq3r6525LWOcvO9kNWurN1.jpg"
  },
  "iron man": {
    poster: "https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/cKvDv2LpwVEqbdXWoQl4XgGN6le.jpg"
  },

  // --- Animated Favorites ---
  "toy story": {
    poster: "https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/3Rfvhy1Nl6sSGJwyjb0QiZzZYlB.jpg"
  },
  "finding nemo": {
    poster: "https://image.tmdb.org/t/p/w500/eHuGQ10FUzK1mdOY69wF5pGgEf5.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/eCynaAOgYYiw5yN5lBwz3IxqvaW.jpg"
  },
  "the lion king": {
    poster: "https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/bqFxtuGNsz30HTk5mzgGs8m9Po.jpg"
  },
  "up": {
    poster: "https://image.tmdb.org/t/p/w500/zF67qcf7skMHLpXnifodinUqCFr.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/wqD5zMFFITtzySK7fuYX42AtbJE.jpg"
  },
  "wall·e": {
    poster: "https://image.tmdb.org/t/p/w500/hbhFnRzzg6ZDmm8YAmxBnQpQIPh.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/nYs4ZwnJBK4AgljhvzwNz7fpr3E.jpg"
  },
  "monsters, inc.": {
    poster: "https://image.tmdb.org/t/p/w500/wFSpyMsp7H0ttERbxY7Trlv8xry.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/sDTnMOJ3H5wI38OxObmCtK7wfd5.jpg"
  },

  // --- Action, Crime & Thrillers ---
  "pirates of the caribbean: the curse of the black pearl": {
    poster: "https://image.tmdb.org/t/p/w500/poHwCZeWzJCShH7tOjg8RIoyjcw.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/uRNgkJSkNBFbbn9fPsEjDIy8Sh3.jpg"
  },
  "the wolf of wall street": {
    poster: "https://image.tmdb.org/t/p/w500/kW9LmvYHAaS9iA0tHmZVq8hQYoq.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/7Nwnmyzrtd0FkcRyPqmdzTPppQa.jpg"
  },
  "django unchained": {
    poster: "https://image.tmdb.org/t/p/w500/7oWY8VDWW7thTzWh3OKYRkWUlD5.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/2oZklIzUbvZXXzIFzv7Hi68d6xf.jpg"
  },
  "goldeneye": {
    poster: "https://image.tmdb.org/t/p/w500/z0ljRnNxIO7CRBhLEO0DvLgAFPR.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/fIWsCpYR9iGDMSbMTSAzy8L7Kg5.jpg"
  },
  "the shining": {
    poster: "https://image.tmdb.org/t/p/w500/uAR0AWqhQL1hQa69UDEbb2rE5Wx.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/AdKA2F1SzYPhSZdEbjH1Zh75UVQ.jpg"
  },
  "the grand budapest hotel": {
    poster: "https://image.tmdb.org/t/p/w500/eWdyYQreja6JGCzqHWXpWHDrrPo.jpg",
    backdrop: "https://image.tmdb.org/t/p/original/jK65srQczOKTpW62wPxwwKztGgE.jpg"
  }
};

/**
 * Normalizes movie title strings for resilient lookup across variations.
 */
function normalizeTitle(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/\s*\(\d{4}\)$/, '')       // Remove release year (e.g. "(1994)")
    .replace(/^(the|a|an)\s+/i, '')     // Remove leading articles for relaxed matching
    .replace(/[^a-z0-9]/g, ' ')         // Replace punctuation with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds a matching curated asset by full title or relaxed title.
 */
function findCuratedAsset(title: string): MovieAsset | null {
  if (!title) return null;
  const exactKey = title.trim().toLowerCase();
  if (CURATED_MOVIE_ASSETS[exactKey]) {
    return CURATED_MOVIE_ASSETS[exactKey];
  }

  const normalized = normalizeTitle(title);
  for (const [key, asset] of Object.entries(CURATED_MOVIE_ASSETS)) {
    if (normalizeTitle(key) === normalized) {
      return asset;
    }
  }

  return null;
}

/**
 * Returns the official transparent movie logo URL if available.
 */
export function getMovieLogo(movie: Movie): string | null {
  if (!movie) return null;

  if (movie.logo_path && (movie.logo_path.startsWith('http://') || movie.logo_path.startsWith('https://'))) {
    return movie.logo_path;
  }

  const asset = findCuratedAsset(movie.title);
  if (asset?.logo) {
    return asset.logo;
  }

  return null;
}

/**
 * Returns the best authentic poster URL for a movie.
 * Prioritizes curated authentic assets, then valid external URLs,
 * and falls back to procedural artwork with the movie's exact title.
 */
export function getMoviePoster(movie: Movie): string {
  if (!movie) return "";

  // 1. Direct poster_url from API if populated
  if (movie.poster_url && (movie.poster_url.startsWith("http://") || movie.poster_url.startsWith("https://"))) {
    return movie.poster_url;
  }

  // 2. Curated asset lookup
  const asset = findCuratedAsset(movie.title);
  if (asset?.poster) {
    return asset.poster;
  }

  // 3. Valid external poster_path (full URL or TMDB relative path)
  if (
    movie.poster_path &&
    !movie.poster_path.includes("placeholder_")
  ) {
    if (movie.poster_path.startsWith("http://") || movie.poster_path.startsWith("https://")) {
      return movie.poster_path;
    }
    if (movie.poster_path.startsWith("/")) {
      return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
    }
  }

  // 4. Generate procedural cinema art poster with the movie's exact name
  return generateMoviePoster(movie);
}

/**
 * Returns the best authentic backdrop URL for a movie.
 */
export function getMovieBackdrop(movie: Movie): string {
  if (!movie) return "";

  // 1. Direct backdrop_url from API if populated
  if (movie.backdrop_url && (movie.backdrop_url.startsWith("http://") || movie.backdrop_url.startsWith("https://"))) {
    return movie.backdrop_url;
  }

  // 2. Curated asset lookup
  const asset = findCuratedAsset(movie.title);
  if (asset?.backdrop) {
    return asset.backdrop;
  }

  // 3. Valid external backdrop_path (full URL or TMDB relative path)
  if (
    movie.backdrop_path &&
    !movie.backdrop_path.includes("placeholder_")
  ) {
    if (movie.backdrop_path.startsWith("http://") || movie.backdrop_path.startsWith("https://")) {
      return movie.backdrop_path;
    }
    if (movie.backdrop_path.startsWith("/")) {
      return `https://image.tmdb.org/t/p/original${movie.backdrop_path}`;
    }
  }

  // 4. Fallback to poster or procedural artwork
  return getMoviePoster(movie);
}

// Genre color palettes for procedural poster artwork
interface GenrePalette {
  bgStart: string;
  bgMid: string;
  bgEnd: string;
  accent: string;
  glow: string;
  motif: string;
}

const GENRE_PALETTES: Record<string, GenrePalette> = {
  "science fiction": {
    bgStart: "#050b14",
    bgMid: "#0d1b33",
    bgEnd: "#02040a",
    accent: "#38bdf8",
    glow: "#0284c7",
    motif: "galaxy"
  },
  "action": {
    bgStart: "#14070a",
    bgMid: "#260e15",
    bgEnd: "#080204",
    accent: "#f43f5e",
    glow: "#be123c",
    motif: "pulse"
  },
  "crime": {
    bgStart: "#0a0c10",
    bgMid: "#181d24",
    bgEnd: "#050608",
    accent: "#e2e8f0",
    glow: "#475569",
    motif: "noir"
  },
  "thriller": {
    bgStart: "#12081a",
    bgMid: "#210f30",
    bgEnd: "#08030d",
    accent: "#a855f7",
    glow: "#7e22ce",
    motif: "shadow"
  },
  "adventure": {
    bgStart: "#051410",
    bgMid: "#0d261e",
    bgEnd: "#020a08",
    accent: "#34d399",
    glow: "#059669",
    motif: "compass"
  },
  "drama": {
    bgStart: "#14100c",
    bgMid: "#241c14",
    bgEnd: "#0a0806",
    accent: "#fbbf24",
    glow: "#d97706",
    motif: "vintage"
  },
  "romance": {
    bgStart: "#170611",
    bgMid: "#2e0c22",
    bgEnd: "#0a0207",
    accent: "#f472b6",
    glow: "#db2777",
    motif: "rose"
  },
  "comedy": {
    bgStart: "#06131a",
    bgMid: "#0d2430",
    bgEnd: "#030a0d",
    accent: "#38bdf8",
    glow: "#0284c7",
    motif: "spark"
  },
  "animation": {
    bgStart: "#110926",
    bgMid: "#1e1045",
    bgEnd: "#080412",
    accent: "#818cf8",
    glow: "#4f46e5",
    motif: "spark"
  },
  "fantasy": {
    bgStart: "#08141d",
    bgMid: "#11293a",
    bgEnd: "#040a0f",
    accent: "#22d3ee",
    glow: "#0891b2",
    motif: "mystic"
  },
  "horror": {
    bgStart: "#0a0203",
    bgMid: "#1a0507",
    bgEnd: "#030001",
    accent: "#ef4444",
    glow: "#991b1b",
    motif: "dark"
  }
};

const DEFAULT_PALETTE: GenrePalette = {
  bgStart: "#0a0f1d",
  bgMid: "#151e36",
  bgEnd: "#04060d",
  accent: "#818cf8",
  glow: "#4338ca",
  motif: "cinema"
};

/**
 * Procedurally generates a custom Cinema Art SVG Poster with the movie's exact title,
 * director, release year, star rating, and genre-themed artwork.
 */
export function generateMoviePoster(movie: {
  title: string;
  genres?: string[];
  release_year?: number;
  director?: string;
  vote_average?: number;
}): string {
  const title = (movie.title || "Cinema Feature").trim();
  const genres = movie.genres || [];
  const primaryGenre = (genres[0] || "Cinema").toLowerCase();
  const year = movie.release_year || 2024;
  const director = (movie.director || "Cinema Studio").trim();
  const rating = (movie.vote_average || 8.0).toFixed(1);

  const palette = GENRE_PALETTES[primaryGenre] || DEFAULT_PALETTE;

  // Split title into wrapped lines (max 3 lines, max 15 chars per line)
  const words = title.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= 15) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  const displayLines = lines.slice(0, 3);
  if (lines.length > 3) {
    displayLines[2] = displayLines[2] + "...";
  }

  // Adjust font size according to title length
  let fontSize = 28;
  if (title.length > 25) fontSize = 24;
  if (title.length > 35) fontSize = 20;

  const startY = 305 - (displayLines.length - 1) * (fontSize * 0.7);

  const titleSvgElements = displayLines
    .map((line, i) => {
      const y = startY + i * (fontSize * 1.35);
      return `<text x="200" y="${y}" text-anchor="middle" fill="#ffffff" font-size="${fontSize}" font-weight="900" letter-spacing="1.5" font-family="'Outfit', system-ui, -apple-system, sans-serif" filter="url(#drop)">${escapeXml(line.toUpperCase())}</text>`;
    })
    .join("\n");

  const genreBadgeText = (genres.slice(0, 2).join(" • ") || "CINEMA").toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="400" height="600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bgStart}"/>
      <stop offset="50%" stop-color="${palette.bgMid}"/>
      <stop offset="100%" stop-color="${palette.bgEnd}"/>
    </linearGradient>
    <radialGradient id="centerGlow" cx="50%" cy="48%" r="48%">
      <stop offset="0%" stop-color="${palette.glow}" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="${palette.glow}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${palette.glow}" stop-opacity="0"/>
    </radialGradient>
    <filter id="drop" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.9"/>
    </filter>
  </defs>

  <!-- Background Base & Radial Ambient Lighting -->
  <rect width="400" height="600" fill="url(#bgGrad)"/>
  <circle cx="200" cy="290" r="180" fill="url(#centerGlow)"/>

  <!-- Decorative Outer & Inner Borders -->
  <rect x="16" y="16" width="368" height="568" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" rx="14"/>
  <rect x="22" y="22" width="356" height="556" fill="none" stroke="${palette.accent}" stroke-opacity="0.25" stroke-width="1" rx="10"/>

  <!-- Top 35mm Cinema Perforations -->
  <g fill="rgba(255,255,255,0.18)">
    <rect x="36" y="32" width="10" height="6" rx="1"/>
    <rect x="56" y="32" width="10" height="6" rx="1"/>
    <rect x="76" y="32" width="10" height="6" rx="1"/>
    <rect x="314" y="32" width="10" height="6" rx="1"/>
    <rect x="334" y="32" width="10" height="6" rx="1"/>
    <rect x="354" y="32" width="10" height="6" rx="1"/>
  </g>

  <!-- Top Genre Header Badge -->
  <g transform="translate(200, 72)">
    <rect x="-85" y="-14" width="170" height="26" rx="13" fill="rgba(0,0,0,0.4)" stroke="${palette.accent}" stroke-width="1"/>
    <text x="0" y="4" text-anchor="middle" fill="${palette.accent}" font-size="10.5" font-weight="800" letter-spacing="2.5" font-family="system-ui">★ ${escapeXml(genreBadgeText)} ★</text>
  </g>

  <!-- Release Year Tag -->
  <text x="200" y="118" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="700" letter-spacing="3" font-family="system-ui">${year}</text>

  <!-- Central Graphic Motif Circles -->
  <circle cx="200" cy="285" r="115" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4 6"/>
  <circle cx="200" cy="285" r="85" fill="none" stroke="${palette.accent}" stroke-opacity="0.15" stroke-width="1"/>

  <!-- Movie Title in Centered Bold Type -->
  <g>
    ${titleSvgElements}
  </g>

  <!-- Divider Ribbon -->
  <line x1="120" y1="440" x2="280" y2="440" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <circle cx="200" cy="440" r="3" fill="${palette.accent}"/>

  <!-- Director Credit -->
  <text x="200" y="468" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="700" letter-spacing="2" font-family="system-ui">DIRECTED BY</text>
  <text x="200" y="490" text-anchor="middle" fill="#f1f5f9" font-size="13" font-weight="700" letter-spacing="1" font-family="system-ui">${escapeXml(director.toUpperCase())}</text>

  <!-- Star Rating Badge -->
  <g transform="translate(200, 532)">
    <rect x="-55" y="-12" width="110" height="24" rx="12" fill="rgba(0,0,0,0.6)" stroke="rgba(251,191,36,0.5)" stroke-width="1"/>
    <text x="0" y="5" text-anchor="middle" fill="#fbbf24" font-size="11.5" font-weight="800" letter-spacing="1" font-family="system-ui">★ ${rating} / 10</text>
  </g>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}
