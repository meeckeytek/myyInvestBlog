
export default function paginatedResults(
  model: any,
  prevName: any,
  nextName: any
) {
  return async (
    req: Request | any,
    res: Response | any,
    next: any
  ) => {
    const page: number = parseInt(req.query.page);
    const limit: number = parseInt(req.query.page) || 1;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results: any = {};

    if (endIndex < (await model.countDocuments().exec())) {
      results.nextPageLink = {
        nextPage: `http://localhost:419/api/v1/${nextName}?page=${
          page + 1
        }&limit=${limit}`,
      };
    }

    if (startIndex > 0) {
      results.previousPageLink = {
        previousPage: `http://localhost:419/api/v1/${prevName}?page=${
          page - 1
        }&limit=${limit}`,
      };
    }

    try {
      results.results = await model.find().limit(limit).skip(startIndex).exec();
      res.paginationResults = results;
      next();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Something went wrong, Please try again later" });
    }
  };
}
