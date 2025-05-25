<?
require_once('../common.php');

$ModeIsJSON = @$_GET['mode'] === 'json';
if($ModeIsJSON)
  CORSHeadersRender();

$LEngToUkr = $_GET['Direction'] == 'EngToUkr';
$LPrefix = $LEngToUkr ? 'e2u' : 'u2e';
$LAction = isset($_GET['action']) ? $_GET['action'] : '';
if($LAction)
{
  $WordID = $_GET['id'];
  $LSQL = '
    INSERT INTO word_users(word_id, user_id)
    SELECT $1, $2
    WHERE NOT EXISTS(SELECT *
      FROM word_users
      WHERE (word_id, user_id) = ($1, $2)
    )';
  pg_query_params($Con, $LSQL, [$WordID, $UserID]);

  $LField = $LPrefix . '_' . ($LAction == 'Right' ? 'right' : 'wrong') . '_count';

  $LSQL = "
    UPDATE word_users
    SET $LField = $LField + 1
    WHERE (word_id, user_id) = ($1, $2)";
  pg_query_params($Con, $LSQL, [$WordID, $UserID]);

  $LSQL = '
    INSERT INTO daily_stat(user_id)
    SELECT $1
    WHERE NOT EXISTS(SELECT *
      FROM daily_stat
      WHERE (day, user_id) = (CURRENT_DATE, $1)
    )';
  pg_query_params($Con, $LSQL, [$UserID]);

  $LSQL = "
    UPDATE daily_stat
    SET $LField = $LField + 1
    WHERE (day, user_id) = (CURRENT_DATE, $1)";
  pg_query_params($Con, $LSQL, [$UserID]);
}
?>

<?if(!$ModeIsJSON)
{
HeaderRender();
?>
<a href="a.php">words</a>
<?
$LSQL = '
  SELECT
    e2u_right_count + e2u_wrong_count e2u_sum,
    u2e_right_count + u2e_wrong_count u2e_sum
  FROM daily_stat
  WHERE day = CURRENT_DATE
    AND user_id = $1';
$Sum = pg_fetch_all(pg_query_params($Con, $LSQL, [$UserID]));
if($Sum)
{
  $Sum = $Sum[0];
  ?>, sum for today: <?=$Sum['e2u_sum']?> + <?=$Sum['u2e_sum']?> = <?=$Sum['e2u_sum'] + $Sum['u2e_sum']?><?
}?>
<br><br>
<?}?>

<?
$LSQL = '
  SELECT W.id, W.word, W.translation,
    array_to_string(Array[WU.e2u_right_count, WU.e2u_wrong_count, WU.u2e_right_count, WU.u2e_wrong_count], \' / \') stat
  FROM words W
    LEFT JOIN word_users WU
      ON (WU.word_id, WU.user_id) = (W.id, $1)
  WHERE NOT W.is_deleted
  ' . ($LEngToUkr ? '' : ' AND W.translation IS NOT NULL AND W.translation <> \'\'') . '
  ORDER BY ' . CheckSortByBuild($LPrefix, true) . ', random()
  LIMIT 1';

$Word = pg_fetch_all(pg_query_params($Con, $LSQL, [$UserID]))[0];

if($ModeIsJSON)
{
  echo json_encode($Word);
  exit;
}

?>

<?=$Word[$LEngToUkr ? 'word' : 'translation']?> (<?=$Word['stat']?>)<br><br>

<button value="aaa" onclick="ShowTranslation()">Show Translation</button><br><br>

<form method="get">
<input type="hidden" name="Direction" value="<?=$_GET['Direction']?>">
<input type="hidden" name="id" value="<?=$Word['id']?>">
<div id="Translation" style="display:none">
<?=$Word[$LEngToUkr ? 'translation' : 'word']?><br><br>
<button onclick="Speak('<?=addslashes($Word['word'])?>', event);return false">Speak</button><br><br>
<input type="submit" name="action" value="Right">
<input type="submit" name="action" value="Wrong">
</div>
</form>


<script>
function ShowTranslation()
{
  document.getElementById('Translation').style.display = '';
  Speak('<?=addslashes($Word['word'])?>');
}
</script>