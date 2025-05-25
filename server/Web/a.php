<?require_once('../common.php')?>

<?
$Action = @$_GET['a'];
if($Action == 'BadMarkSet')
{
  $LUID = $_GET['uid'];
  $LWID = $_GET['wid'];
  $LSQL = '
    UPDATE word_users
    SET e2u_coef = e2u_coef - $3
    WHERE (word_id, user_id) = ($2, $1)';
  pg_query_params($Con, $LSQL, [$LUID, $LWID, $_GET['c']]);

  header('Content-Type: text/javascript');

  ?>
  var LTemplate = 'javascript:BadMarkSet(<?=$LUID?>, <?=$LWID?>)';
  var Es = document.getElementsByTagName('a');
  for(var i = 0; i < Es.length; i++)
    if(Es[i].href === LTemplate)
    {
      Es[i].innerText = Es[i].innerText - <?=$_GET['c']?>;
      break;
    }
  <?

  exit;
}

HeaderRender();
?>

<div class="RootPageTopNavigator">
<div style="margin-bottom:4px">
<input onclick="location.href='WordUpdate.php'" type='button' value='Add New' />
<a href="CheckWord.php?Direction=EngToUkr">Test English</a>
<a href="CheckWord.php?Direction=UkrToEng">Test Ukrainian</a>
<a href="DailyStat.php">Daily Stat</a>
</div>

<?
$SortByP = @$_GET['sort'];
switch ($SortByP) {
case 'n':
  $SortBy = 'word';
  break;
case 't':
  $SortBy = 'translation';
  break;
case 'te':
  $SortBy = CheckSortByBuild('e2u');
  break;
case 'tu':
  $SortBy = CheckSortByBuild('u2e');
  break;
default:
  $SortBy = 'date_created DESC';
}

$LSQL = '
  SELECT
    (EXTRACT(EPOCH FROM (now() - date_created)) / 60 / 60 / 24)::int created_days_ago,
    W.*,
    ' . CheckSortByBuild('e2u') . ' rank_en,
    ' . CheckSortByBuild('u2e') . ' rank_uk,
    ' . CheckSortByBuild('e2u', false, '_Va') . ' rank_en_va,
    ' . CheckSortByBuild('e2u', false, '_Vo') . ' rank_en_vo';
if($UserID == 1)
  $LSQL .= ',
    ' . CheckSortByBuild('e2u', false, '_YD') . ' rank_en_yd';
$LSQL .= '
  FROM words W
    LEFT JOIN word_users WU
      ON (WU.word_id, WU.user_id) = (W.id, $1)
    LEFT JOIN word_users WU_Va
      ON (WU_Va.word_id, WU_Va.user_id) = (W.id, 2)
    LEFT JOIN word_users WU_Vo
      ON (WU_Vo.word_id, WU_Vo.user_id) = (W.id, 3)';
if($UserID == 1)
  $LSQL .= '
    LEFT JOIN word_users WU_YD
      ON (WU_YD.word_id, WU_YD.user_id) = (W.id, 1)';
$LSQL .= '
  WHERE NOT is_deleted
  ORDER BY ' . $SortBy;
$Words = pg_fetch_all(pg_query_params($Con, $LSQL, [$UserID]));
?>

<script>
var LSearchHE, LWordsHE;
function Search(AText)
{
  if(!LSearchHE)
    var LSearchHE = document.getElementById('search');
  if(AText === undefined)
    AText = LSearchHE.value;
  else
    LSearchHE.value = AText;

  if(!LWordsHE)
    LWordsHE = document.getElementById('words').firstElementChild;
  sessionStorage['Search'] = AText;
  if(AText === '')
    LWordsHE.className = '';
  else
  {
    LWordsHE.className = 'filtered';
    for(var i = 1, L = LWordsHE.childElementCount; i < L; i++)
    {
      var LHE = LWordsHE.children[i];
      // if(AText === '')
      //   LHE.style.display = '';
      // else
      //   LHE.style.display = (LHE.firstElementChild.firstElementChild.text.search(AText) === -1 && LHE.childNodes[1].textContent.search(AText) === -1) ? 'none' : '';
      if(AText === '')
        LHE.className = '';
      else
        LHE.className = (LHE.firstElementChild.firstElementChild.text.search(AText) === -1 && LHE.childNodes[1].textContent.search(AText) === -1) ? 'hidden' : '';
    }
  }
}

function BadMarkSet(AUserID, AWordID)
{
  var LCount = prompt('Count', 5);
  if(LCount)
  {
    //location.href = '?a=BadMarkSet&uid=' + AUserID + '&wid=' + AWordID + '&c=' + LCount;
    ScriptHEAdd('?a=BadMarkSet&uid=' + AUserID + '&wid=' + AWordID + '&c=' + LCount);
  }
}

</script>

<input id="search" type="text" placeholder="search" style="margin-bottom: 5px;width: 100px;" onkeyup="Search()"> <button onclick="Search('');return false">X</button>
<form action="?" style="display: inline"><select name="sort" onchange="this.form.submit()">
<option>Date DESC
<option value="n"<?=$SortByP == 'n' ? ' selected' : ''?>>Name
<option value="t"<?=$SortByP == 't' ? ' selected' : ''?>>Translation
<option value="te"<?=$SortByP == 'te' ? ' selected' : ''?>>Test En
<option value="tu"<?=$SortByP == 'tu' ? ' selected' : ''?>>Test Uk
</select></form>
</div>
<br><br><br>

<table id="words" border="1">
<tr style="background-color:#DDD"><th>Word<th>Translation<!--th>Created Days Ago</th--><th>Speak<th>RE<th>RU<th>Va<th>Vo<?if($UserID == 1){ ?><th>YD<? }?></tr>
<?

//echo implode(' ', $Words);
if($Words)
{
  $LEvenRow = false;
  foreach($Words as $Word)
  {
    ?><tr <?=$LEvenRow ? 'style="background-color: #F5F5F5"' : ''?>><?
      ?><td><a href="WordUpdate.php?key=<?=$Word['word']?>"><?=$Word['word']?></td><?
      ?><td<?
      ?>><?=$Word['translation'] ?: '<b style="color:red;display:block;text-align:center">!! ' . $Word['id'] . ' !!</b>'?></td><?
      /*?><td class="number"><?=$Word['created_days_ago']?></td><?*/
      ?><td style="padding:0;text-align:center"><span onclick="Speak('<?=addslashes($Word['word'])?>')" class="material-icons" style="cursor:pointer;font-size: 26px;">volume_up</span></td><?

      ?><td style="text-align:right"><?=$Word['rank_en']?><?
      ?><td style="text-align:right"><?=$Word['rank_uk']?><?

      ?><td style="text-align:right"><a href="javascript:BadMarkSet(2, <?=$Word['id']?>)"><?=$Word['rank_en_va']?></a><?
      ?><td style="text-align:right"><a href="javascript:BadMarkSet(3, <?=$Word['id']?>)"><?=$Word['rank_en_vo']?></a><?
      if($UserID == 1)
      {
        ?><td style="text-align:right"><a href="javascript:BadMarkSet(1, <?=$Word['id']?>)"><?=$Word['rank_en_yd']?></a><?
      }

    ?></tr><?
    $LEvenRow = !$LEvenRow;
  }
}
?>

</table><br>

<script>
var S = sessionStorage['Search'];
if(S)
  Search(S);
function ScriptHEAdd(AURL)
{
  function LOnLoad(AEvent)
  {
    AEvent.target.parentNode.removeChild(AEvent.target);
  }

  var LScriptHE = document.createElement('script');
  LScriptHE.onload  = LOnLoad;
  LScriptHE.onerror = LOnLoad;
  LScriptHE.setAttribute('src', AURL);
  document.head.appendChild(LScriptHE);
  LScriptHE = null;
}
</script>

<div qstyle="position:absolute;right:0;top:0;">UserID: <?=$UserID?></div>