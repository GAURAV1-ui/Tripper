const Guide = require("../models/guide");
const Package = require("../models/package");
const bcrypt = require("bcrypt");
const Blog = require("../models/blog");
const fs = require("fs");
const fileHelper = require("../utils/file");
//guide register
exports.getRegister = (req, res) => {
  res.render("guide/signup");
};
exports.postRegister = async (req, res, next) => {
  const gname = req.body.gname;
  const gemail = req.body.gemail;
  const password = req.body.gpass;
  const phone = req.body.phone;

  const confirmPassword = req.body.gpassc;
  if (await Guide.findOne({ guideEmail: gemail })) {
    return res.redirect("/guide/register", { error: "Email already exists" });
  }

  const hashedPass = await bcrypt.hash(password, 12);
  const guide = new Guide({
    guidePassword: hashedPass,
    guideEmail: gemail,
    name: gname,
    phone: phone,
  });
  guide.save().then((result) => {
    res.redirect("/guide-login");
  });
};
//login
exports.getLogin = (req, res) => {
  res.render("guide/guidelogin");
};
exports.postLogin = async (req, res, next) => {
  const gemail = req.body.email;
  const gpass = req.body.pass;

  Guide.findOne({ guideEmail: gemail })
    .then((guide) => {
      if (!guide) {
        return res.redirect("/guide-login");
      }
      bcrypt
        .compare(gpass, guide.guidePassword)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isLoggedIn = true;
            req.session.guide = guide;
            return req.session.save((err) => {
              res.redirect("/guide-dashboard");
            });
          }
          res.redirect("/guide-login");
        })
        .catch((err) => {
          console.log(err);
          res.redirect("/guide-login");
        });
    })
    .catch((err) => console.log(err));
};
//destroying the session
exports.postLogout = (req, res) => {
  req.session.destroy((err) => {
    // console.log(err);
    res.redirect("/guide-login");
  });
};

exports.getGuideDashboard = async (req, res, next) => {
  const blogs = await Blog.find({ blogAuthor: req.guide._id }).exec();
  const blogLabels = [];
  const likes = [];
  const dislikes = [];
  blogs.forEach((blog) => {
    if (blog.status === "approved") {
      blogLabels.push(blog.blogTitle);
      likes.push(blog.likes);
      dislikes.push(blog.dislikes);
    }
  });

  res.render("guide/gdashboard", {
    guide: req.guide,
    blogLabels: blogLabels,
    likes: likes,
    dislikes: dislikes,
    profileImage: req.guide.guideImage,
  });
};

exports.getAddPackage = (req, res, next) => {
  if (!req.guide.guideAccepted) {
    return res.redirect("/guide-dashboard");
  }
  res.render("guide/package/add-package", {
    guide: req.guide,
    profileImage: req.guide.guideImage,
  });
};

exports.postAddPackage = (req, res, next) => {
  // const pimage = req.file;
  // if (!pimage) {
  //   return res.redirect("/guide/addpackage");
  // }
  const { pname, pprice, pdesc, pslot, pduration, proutes, pinitary } =
    req.body;

  const p1 = new Package({
    title: pname,
    packagePrice: pprice,
    packageDescription: pdesc,
    packageSlot: pslot,
    packageDuration: pduration,
    packageRoutes: proutes,
    packageImage: req.file.filename,
    packageItinerary: pinitary,
    packageGuide: req.guide._id,
  });

  p1.save()
    .then((p) => {
      Guide.findById(req.guide._id).then((guide) => {
        guide.packages.push(p);
        guide.save();
      });
      return res.redirect("/guide-packagelist");
    })
    .catch((err) => {
      console.log(err);
      return res.redirect("/guide-dashboard");
    });
};
exports.getPackageList = (req, res, next) => {
  Package.find({ packageGuide: req.guide._id }).then((packages) => {
    res.render("guide/package/package-list", {
      guide: req.guide,
      packageList: packages,
      profileImage: req.guide.guideImage,
    });
  });
};

exports.deletePackage = async (req, res, next) => {
  const pId = req.body.pId;

  await Package.findByIdAndRemove(pId)
    .then(async (package) => {
      if (!package) {
        throw "Not found";
      }
      if (package.packageGuide.equals(req.guide._id)) {
        const g = await Guide.findByIdAndUpdate(req.guide._id, {
          $pull: { packages: package._id },
        });
        const pathImg = "upload/images/" + package.packageImage;
        if (fs.existsSync(pathImg)) {
          fileHelper.deleteFiles(pathImg);
        }
      } else {
        console.log("You are not allowed!");
      }
    })
    .catch((err) => {
      console.log(err);
    });
  res.redirect("/guide-packagelist");
};

exports.editePackage = (req, res, next) => {
  const pId = req.params.pId;
};

//blogs
exports.getAddBlog = (req, res, next) => {
  if (!req.guide.guideAccepted) {
    return res.redirect("/guide/dashboard");
  }
  res.render("guide/add-blog", {
    guide: req.guide,
    profileImage: req.guide.guideImage,
  });
};
exports.getBlogList = (req, res, next) => {
  const guide = req.guide;
  // return console.log(guide);
  Blog.find({ author: guide._id }).then((blogs) => {
    // return console.log(blogs);
    res.render("guide/blog-list", {
      guide: guide,
      blogs: blogs,
      profileImage: req.guide.guideImage,
    });
  });
};

exports.viewBlog = async (req, res, next) => {
  const blogId = req.body.blogId;

  Blog.findById(blogId)
    .populate("author")
    .exec()
    .then((blog) => {
      if (blog.status === "approved") {
        return res.redirect("/blog/" + blogId);
      }
      res.render("viewblog", {
        guide: req.guide,
        isTouristAuth: false,
        isGuideAuth: false,
        blog: blog,
        nextBlog: nextBlog,
        prevBlog: prevBlog,
        profileImage: req.guide.guideImage,
      });
    });
};

//edit profile
exports.getEditProfile = (req, res, next) => {
  res.render("guide/edit-profile", {
    guide: req.guide,
    profileImage: req.guide.guideImage,
  });
};

exports.getProfile = (req, res, next) => {
  if (!req.guide.profileComplete) {
    return res.redirect("/guide-edit-profile");
  }
  res.render("guide/profile", {
    guide: req.guide,
    profileImage: req.guide.guideImage,
  });
};

exports.postEditProfile = (req, res, next) => {
  const profileImage = req.file;

  let image = req.guide.guideImage;
  if (profileImage) {
    const pathImg = "upload/images/" + image;
    if (image && fs.existsSync(pathImg)) {
      fileHelper.deleteFiles(pathImg);
    }
    image = profileImage.filename;
  }
  const {
    contact,
    name,

    address,
  } = req.body;
  Guide.findOne({ _id: req.guide._id })
    .then((guide) => {
      guide.name = name;
      guide.phone = contact;

      guide.guideAddress = address;

      guide.guideImage = image;
      guide.profileComplete = true;

      return guide.save();
    })
    .then((result) => {
      res.redirect("/guide-profile");
    })
    .catch((err) => console.log(err));
};

//package
exports.getPackageBookDetails = (req, res, next) => {
  const pId = req.params.id;
};

//booking
exports.getBookingList = (req, res, next) => {
  const packageId = req.params.id;
  const guide = req.guide;
  Package.findById(packageId)
    .populate({
      path: "booked",
      model: "Booked",
      populate: {
        path: "tourist",
        model: "Tourist",
      },
    })
    .exec()
    .then((package) => {
      res.render("guide/booking_details", {
        guide: guide,
        package: package,
        profileImage: req.guide.guideImage,
      });
    });
};
