const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');
const upload=require('../middleware/multerConfig');
const userAuthenticate=require('../middleware/userAuth');
const adminAuthenticate=require('../middleware/adminAuth');


router.get('/add/:id',adminAuthenticate,paperController.addPaperForVerification);
router.get('/pending-papers', adminAuthenticate,paperController.getPendingPapers);
router.get('/my-pending-papers',adminAuthenticate,paperController.getMyPendingVerificationPapers);
router.delete('/remove/:id',adminAuthenticate,paperController.removePaperFromMyPendingVerification);

router.post('/upload',userAuthenticate,upload.single('pdf'), paperController.uploadPaper);
router.get('/',userAuthenticate,paperController.getPapers);
router.delete('/paper/:id',userAuthenticate,paperController.deletePaperById);
router.delete('/admin/:id',adminAuthenticate,paperController.deletePaperById);

router.get('/colleges',adminAuthenticate,paperController.getColleges);
router.post('/college/upload',adminAuthenticate,paperController.uploadCollege);

router.post('/course/upload',adminAuthenticate,paperController.uploadCourse);
router.get('/courses',userAuthenticate,paperController.getCourses);

router.post('/department/upload',adminAuthenticate,paperController.uploadDepartment);
router.get('/departments',userAuthenticate,paperController.getDepartments);

router.get('/my-papers',userAuthenticate, paperController.getMyPapers);

router.get('/my-verified-papers',adminAuthenticate,paperController.getMyVerifiedPapers);


router.patch('/valid/:id',adminAuthenticate,paperController.addToValidPaper);
router.delete('/invalid/:id',adminAuthenticate,paperController.invalidFromVerificationPending);

router.get('/:id',userAuthenticate,paperController.getPaperById);
router.put('/:id',userAuthenticate,upload.single('pdf'),paperController.updatePaper);




module.exports=router;