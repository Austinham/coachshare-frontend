import { db } from '../db';
import { sendEmail } from '../utils/email';

export async function shareRegimen(req, res) {
  try {
    const { regimenId, email, permission } = req.body;
    const userId = req.user.id; // Assuming you have auth middleware
    
    // Check if the user owns the regimen
    const regimen = await db.query(
      'SELECT * FROM regimens WHERE id = $1 AND user_id = $2',
      [regimenId, userId]
    );
    
    if (regimen.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to share this regimen' });
    }
    
    // Check if the user already has access to this regimen
    const existingShare = await db.query(
      'SELECT * FROM shared_regimens WHERE regimen_id = $1 AND shared_with_email = $2',
      [regimenId, email]
    );
    
    if (existingShare.rows.length > 0) {
      // Update existing share
      await db.query(
        'UPDATE shared_regimens SET permission = $1, updated_at = NOW() WHERE regimen_id = $2 AND shared_with_email = $3',
        [permission, regimenId, email]
      );
    } else {
      // Create new share
      await db.query(
        'INSERT INTO shared_regimens (regimen_id, user_id, shared_with_email, permission) VALUES ($1, $2, $3, $4)',
        [regimenId, userId, email, permission]
      );
    }
    
    // Generate share link
    const shareLink = `${process.env.FRONTEND_URL}/shared/regimen/${regimenId}`;
    
    // Send email notification
    await sendEmail({
      to: email,
      subject: `${req.user.name} shared a training program with you`,
      html: `
        <p>Hello,</p>
        <p>${req.user.name} has shared a training program with you: "${regimen.rows[0].name}"</p>
        <p>You can ${permission === 'edit' ? 'view and edit' : 'view'} this program by clicking the link below:</p>
        <p><a href="${shareLink}">View Training Program</a></p>
        <p>Thank you,<br>CoachShare Team</p>
      `
    });
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sharing regimen:', error);
    return res.status(500).json({ error: 'Failed to share regimen' });
  }
}

export async function updateRegimenPublicStatus(req, res) {
  try {
    const { regimenId } = req.params;
    const { isPublic } = req.body;
    const userId = req.user.id; // Assuming you have auth middleware
    
    // Check if the user owns the regimen
    const regimen = await db.query(
      'SELECT * FROM regimens WHERE id = $1 AND user_id = $2',
      [regimenId, userId]
    );
    
    if (regimen.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to update this regimen' });
    }
    
    // Update public status
    await db.query(
      'UPDATE regimens SET is_public = $1, updated_at = NOW() WHERE id = $2',
      [isPublic, regimenId]
    );
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating regimen public status:', error);
    return res.status(500).json({ error: 'Failed to update regimen public status' });
  }
}

export async function getSharedRegimen(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Optional, as public regimens don't require auth
    
    // Check if the regimen is public or shared with the user
    const regimen = await db.query(`
      SELECT r.* FROM regimens r
      LEFT JOIN shared_regimens sr ON r.id = sr.regimen_id
      WHERE r.id = $1 AND (
        r.is_public = true OR
        r.user_id = $2 OR
        (sr.shared_with_email = $3 AND sr.regimen_id = $1)
      )
    `, [id, userId, req.user?.email]);
    
    if (regimen.rows.length === 0) {
      return res.status(404).json({ error: 'Program not found or you do not have permission to view it' });
    }
    
    // Get the days and exercises for the regimen
    const days = await db.query(`
      SELECT * FROM regimen_days WHERE regimen_id = $1 ORDER BY date
    `, [id]);
    
    const exercises = await db.query(`
      SELECT * FROM exercises WHERE regimen_day_id IN (
        SELECT id FROM regimen_days WHERE regimen_id = $1
      )
    `, [id]);
    
    // Group exercises by day
    const daysWithExercises = days.rows.map(day => {
      const dayExercises = exercises.rows.filter(ex => ex.regimen_day_id === day.id);
      return {
        ...day,
        exercises: dayExercises
      };
    });
    
    // Format response
    const response = {
      ...regimen.rows[0],
      days: daysWithExercises
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching shared regimen:', error);
    return res.status(500).json({ error: 'Failed to fetch shared regimen' });
  }
} 