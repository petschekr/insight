/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
/* eslint-disable jsx-a11y/anchor-is-valid */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable no-param-reassign */
/* eslint-disable no-underscore-dangle */
import React, { useEffect, useMemo, useState } from "react";
import { useTable, usePagination, Column } from "react-table";
import { DateTime } from "luxon";
import axios from "axios";

import TableFilter from "./TableFilter";
import { handleAddVisit, generateTag, tagButtonHandler } from "./util";
import ParticipantModal from "./ParticipantModal";

const ParticipantTable: React.FC = () => {
  // Table filtering states
  const [searchQuery, setSearchQuery] = useState("");
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [pageIndex, setPageIndex] = useState(0);

  const [data, setData] = useState<any>([]);

  useEffect(() => {
    async function getInitialData() {
      const response = await axios.get("/api/search", {
        params: {
          q: "",
          page: 0,
          filter: "",
        },
      });

      setData(response.data);
    }

    getInitialData();
  }, []);

  const [detailModalInfo, setDetailModalInfo] = useState<any>(null);

  const [dataPageCount, setDataPageCount] = useState(0);
  useEffect(() => {
    setDataPageCount(data ? Math.ceil(data.total / data.pageSize) : 0);

    if (detailModalInfo) {
      const updatedParticipant = data.participants.find(
        (participant: any) => participant._id === detailModalInfo._id
      );
      if (updatedParticipant) {
        setDetailModalInfo(updatedParticipant);
      }
    }
  }, [data]);

  const fetchData = async () => {
    const response = await axios.get("/api/search", {
      params: {
        q: searchQuery,
        page: pageIndex,
        filter: JSON.stringify(tagsFilter),
      },
    });

    setData(response.data);
  };

  const columns = useMemo<Column<any>[]>(
    () => [
      {
        Header: "Time",
        accessor: (row, i) => {
          if (row.visitData?.time) {
            const time = new Date(row.visitData.time);
            return DateTime.fromJSDate(time).toLocaleString(DateTime.DATETIME_SHORT);
          }

          return "-";
        },
      },
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Major",
        accessor: (row, i) => row.major || "Unknown",
        id: "major",
      },
      {
        Header: "Links",
        accessor: "links",
      },
      {
        Header: "Tags",
        accessor: (row, i) => {
          if (row.visitData?.tags) {
            return (
              <div className="field is-grouped is-grouped-multiline">
                {row.visitData.tags.map((tag: string) =>
                  generateTag(row.visitData, tag, fetchData)
                )}
              </div>
            );
          }

          return null;
        },
        id: "tags",
      },
      {
        Header: "Actions",
        accessor: (row, i) => {
          const actions = [];
          if (row.visitData?.time) {
            actions.push(
              <button
                className="button tooltip"
                data-tooltip="Star"
                onClick={() => tagButtonHandler(row.visitData, "starred", fetchData)}
              >
                <span className="icon">
                  <i className="fas fa-star" />
                </span>
              </button>
            );
            actions.push(
              <button
                className="button tooltip"
                data-tooltip="Flag"
                onClick={() => tagButtonHandler(row.visitData, "flagged", fetchData)}
              >
                <span className="icon">
                  <i className="fas fa-flag" />
                </span>
              </button>
            );
            actions.push(
              <button
                className="button tooltip"
                data-tooltip="Add a tag"
                onClick={() => tagButtonHandler(row.visitData, "", fetchData)}
              >
                <span className="icon">
                  <i className="fas fa-tag" />
                </span>
              </button>
            );
          } else {
            actions.push(
              <button
                className="button tooltip"
                data-tooltip="Add to visited list"
                onClick={() => handleAddVisit(row, fetchData)}
              >
                <span> Mark as Visited </span>
                <span className="icon">
                  <i className="fas fa-plus" />
                </span>
              </button>
            );
          }

          actions.push(
            <button className="button view-action" onClick={() => setDetailModalInfo(row)}>
              <span>View / Edit</span>
              <span className="icon">
                <i className="fas fa-external-link-alt" />
              </span>
            </button>
          );

          return actions;
        },
        id: "actions",
      },
    ],
    [searchQuery, pageIndex, tagsFilter]
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    state: { pageIndex: reactTablePageIndex },
    prepareRow,
  } = useTable(
    {
      columns,
      data: data?.participants || [],
      manualPagination: true,
      initialState: { pageIndex: 0 },
      pageCount: dataPageCount,
    },
    usePagination
  );

  // Will fetch new data whenever the page index, search query, or tags filter changes
  useEffect(() => {
    setPageIndex(reactTablePageIndex);
    fetchData();
  }, [reactTablePageIndex, searchQuery, tagsFilter]);

  return (
    <>
      <h1 className="title">Search</h1>
      <TableFilter
        tagsFilter={tagsFilter}
        setTagsFilter={setTagsFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />
      <table className="table is-hoverable is-fullwidth" id="search-table" {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {page.map((row, i) => {
            prepareRow(row);
            return (
              <tr {...row.getRowProps()}>
                {row.cells.map(cell => (
                  <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <nav className="pagination is-centered" role="navigation" aria-label="pagination">
        <button
          className="button pagination-previous"
          onClick={() => gotoPage(0)}
          disabled={!canPreviousPage}
        >
          {"<<"}
        </button>
        <button
          className="button pagination-previous"
          onClick={() => previousPage()}
          disabled={!canPreviousPage}
        >
          {"<"}
        </button>
        <div className="pagination-list">
          <span style={{ marginRight: "6px" }}>
            Page{" "}
            <strong>
              {pageIndex + 1} of {Math.max(1, pageOptions.length)}
            </strong>
          </span>
          <span> | Go to page: </span>
          <input
            className="input is-small"
            type="number"
            defaultValue={pageIndex + 1}
            onChange={e => {
              const newPage = e.target.value ? Number(e.target.value) - 1 : 0;
              gotoPage(newPage);
            }}
            style={{ width: "100px" }}
          />
        </div>
        <button
          className="button pagination-next"
          onClick={() => nextPage()}
          disabled={!canNextPage}
        >
          {">"}
        </button>
        <button
          className="button pagination-next"
          onClick={() => gotoPage(pageCount - 1)}
          disabled={!canNextPage}
        >
          {">>"}
        </button>
      </nav>
      <ParticipantModal
        participant={detailModalInfo}
        setDetailModalInfo={setDetailModalInfo}
        fetchData={fetchData}
      />
    </>
  );
};

export default ParticipantTable;
